from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from ..core.config import settings
from ..core.database import get_db
from ..core.security import hash_password, verify_password
from ..models import Cliente, Promocion, RegistroRuleta, MovimientoPuntos
from ..schemas.cliente import ClienteCreate, ClienteOut
from ..schemas.promocion import PromocionCreate, PromocionOut
from ..schemas.registro import GiroRequest, RegistroRuletaOut, RuletaResult
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ClienteAuthOut,
    AdminLoginRequest,
    AdminLoginResponse,
)
from ..schemas.puntos import (
    SumarPuntosRequest,
    RedimirPuntosRequest,
    PuntosOut,
    MovimientoOut,
)
from .deps import require_admin
from random import SystemRandom


router = APIRouter()
system_random = SystemRandom()


@router.get("/")
def root():
    return {"status": "ok", "service": "Caturro Café API"}


@router.get("/admin/ping", dependencies=[Depends(require_admin)])
def admin_ping():
    return {"ok": True}

# Helpers
def _admin_password_matches(password: str) -> bool:
    stored = settings.admin_password or ""
    if stored.startswith("$2"):
        try:
            return verify_password(password, stored)
        except ValueError:
            return False
    return password == stored


@router.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest):
    if payload.username.strip().lower() != settings.admin_username.strip().lower():
        raise HTTPException(401, "Credenciales inválidas")
    if not _admin_password_matches(payload.password):
        raise HTTPException(401, "Credenciales inválidas")
    return {"token": settings.admin_token}


# Clientes
@router.post("/clientes", response_model=ClienteOut)
def crear_cliente(payload: ClienteCreate, db: Session = Depends(get_db)):
    c = Cliente(
        nombre_completo=payload.nombre_completo.strip(),
        semestre=payload.semestre.strip(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/clientes", response_model=List[ClienteOut])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).order_by(Cliente.id.desc()).all()


# Promociones (público: lectura; admin: escritura)
@router.get("/promociones", response_model=List[PromocionOut])
def listar_promociones(activas_solo: bool = True, db: Session = Depends(get_db)):
    q = db.query(Promocion)
    if activas_solo:
        q = q.filter(Promocion.activa == True)
    return q.order_by(Promocion.id.asc()).all()


@router.post(
    "/promociones", response_model=PromocionOut, dependencies=[Depends(require_admin)]
)
def crear_promocion(p: PromocionCreate, db: Session = Depends(get_db)):
    total = (
        db.query(func.sum(Promocion.probabilidad))
        .filter(Promocion.activa == True)
        .scalar()
        or 0
    )
    new_total = float(total) + (float(p.probabilidad) if p.activa else 0)
    if new_total <= 0:
        raise HTTPException(400, "La suma de probabilidades activas debe ser > 0")
    promo = Promocion(**p.dict())
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.put(
    "/promociones/{promo_id}",
    response_model=PromocionOut,
    dependencies=[Depends(require_admin)],
)
def actualizar_promocion(
    promo_id: int, p: PromocionCreate, db: Session = Depends(get_db)
):
    promo = db.query(Promocion).filter_by(id=promo_id).first()
    if not promo:
        raise HTTPException(404, "Promoción no encontrada")
    # comprobar suma probabilidades si cambia activa/probabilidad
    if p.activa != promo.activa or float(p.probabilidad) != float(promo.probabilidad):
        total = 0.0
        for item in db.query(Promocion).all():
            if item.id == promo_id:
                continue
            if item.activa:
                total += float(item.probabilidad)
        if p.activa:
            total += float(p.probabilidad)
        if total <= 0:
            raise HTTPException(400, "La suma de probabilidades activas debe ser > 0")
    for k, v in p.dict().items():
        setattr(promo, k, v)
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/promociones/{promo_id}", dependencies=[Depends(require_admin)])
def eliminar_promocion(promo_id: int, db: Session = Depends(get_db)):
    promo = db.query(Promocion).filter_by(id=promo_id).first()
    if not promo:
        raise HTTPException(404, "Promoción no encontrada")

    db.delete(promo)
    db.commit()
    return {"ok": True}


# Girar ruleta (log + resultado)
@router.post("/ruleta/{cliente_id}", response_model=RuletaResult)
def girar_ruleta(cliente_id: int, payload: GiroRequest, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter_by(id=cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")

    promos = db.query(Promocion).filter_by(activa=True).all()
    if not promos:
        raise HTTPException(404, "No hay promociones activas")

    pesos = [float(p.probabilidad) for p in promos]
    total_prob = sum(pesos)
    if total_prob <= 0:
        raise HTTPException(400, "La suma de probabilidades activas debe ser > 0")

    r = system_random.random() * total_prob
    acc = 0.0
    ganadora = promos[-1]
    for p, peso in zip(promos, pesos):
        acc += peso
        if r <= acc:
            ganadora = p
            break

    # log
    log = RegistroRuleta(
        cliente_id=cliente_id,
        promocion_id=ganadora.id,
        fecha_giro=payload.fecha_giro,
    )
    db.add(log)
    db.commit()

    mensaje = f"¡Felicidades {cliente.nombre_completo}! Has ganado: {ganadora.nombre}"
    return {"promocion": ganadora, "mensaje": mensaje}


# Estadísticas
@router.get("/estadisticas")
def stats(db: Session = Depends(get_db)):
    total_clientes = db.query(func.count(Cliente.id)).scalar()
    total_giros = db.query(func.count(RegistroRuleta.id)).scalar()
    top = (
        db.query(Promocion.nombre, func.count(RegistroRuleta.id).label("uses"))
        .join(RegistroRuleta, RegistroRuleta.promocion_id == Promocion.id)
        .group_by(Promocion.nombre)
        .order_by(func.count(RegistroRuleta.id).desc())
        .limit(5)
        .all()
    )
    return {
        "total_clientes": total_clientes or 0,
        "total_giros": total_giros or 0,
        "promociones_top": [{"nombre": n, "total": c} for (n, c) in top],
    }


@router.get("/registros", response_model=List[RegistroRuletaOut])
def listar_registros(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    registros = (
        db.query(RegistroRuleta)
        .options(
            joinedload(RegistroRuleta.cliente), joinedload(RegistroRuleta.promocion)
        )
        .order_by(RegistroRuleta.fecha_giro.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return registros
# ---------------- Autenticación ligera (registro/login) ----------------
@router.post("/auth/register", response_model=ClienteAuthOut)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Cliente).filter(Cliente.cedula == payload.cedula).first()
    if existing:
        raise HTTPException(409, "Cédula ya registrada")
    c = Cliente(
        cedula=payload.cedula.strip(),
        password_hash=hash_password(payload.password),
        nombre_completo=payload.nombre_completo.strip(),
        semestre=payload.semestre.strip(),
        puntos=0,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.post("/auth/login", response_model=ClienteAuthOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.cedula == payload.cedula).first()
    if not c or not c.password_hash or not verify_password(payload.password, c.password_hash):
        raise HTTPException(401, "Credenciales inválidas")
    return c


# ---------------- Puntos ----------------
@router.post("/puntos/agregar", dependencies=[Depends(require_admin)])
def puntos_agregar(payload: SumarPuntosRequest, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.cedula == payload.cedula).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    if payload.puntos <= 0:
        raise HTTPException(400, "Los puntos a sumar deben ser > 0")
    c.puntos = int(c.puntos or 0) + int(payload.puntos)
    mov = MovimientoPuntos(cliente_id=c.id, cambio=payload.puntos, descripcion=payload.descripcion or "")
    db.add(mov)
    db.add(c)
    db.commit()
    return {"ok": True, "puntos": c.puntos}


@router.post("/puntos/redimir", dependencies=[Depends(require_admin)])
def puntos_redimir(payload: RedimirPuntosRequest, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.cedula == payload.cedula).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    if payload.puntos <= 0:
        raise HTTPException(400, "Los puntos a restar deben ser > 0")
    if (c.puntos or 0) < payload.puntos:
        raise HTTPException(400, "No hay puntos suficientes")
    c.puntos = int(c.puntos or 0) - int(payload.puntos)
    mov = MovimientoPuntos(cliente_id=c.id, cambio=-abs(payload.puntos), descripcion=payload.descripcion or "")
    db.add(mov)
    db.add(c)
    db.commit()
    return {"ok": True, "puntos": c.puntos}


@router.get("/clientes/{cliente_id}/puntos", response_model=PuntosOut)
def puntos_detalle(cliente_id: int, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    historial = (
        db.query(MovimientoPuntos)
        .filter(MovimientoPuntos.cliente_id == cliente_id)
        .order_by(MovimientoPuntos.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "cliente_id": c.id,
        "cedula": c.cedula,
        "puntos": int(c.puntos or 0),
        "historial": historial,
    }


@router.get("/clientes/{cliente_id}/registros", response_model=List[RegistroRuletaOut])
def registros_cliente(
    cliente_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = (
        db.query(RegistroRuleta)
        .options(joinedload(RegistroRuleta.promocion), joinedload(RegistroRuleta.cliente))
        .filter(RegistroRuleta.cliente_id == cliente_id)
        .order_by(RegistroRuleta.fecha_giro.desc())
        .offset(skip)
        .limit(limit)
    )
    return q.all()
