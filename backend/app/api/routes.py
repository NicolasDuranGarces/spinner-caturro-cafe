from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from ..core.database import get_db
from ..models import Cliente, Promocion, RegistroRuleta
from ..schemas.cliente import ClienteCreate, ClienteOut
from ..schemas.promocion import PromocionCreate, PromocionOut
from ..schemas.registro import GiroRequest, RegistroRuletaOut
from .deps import require_admin
import random


router = APIRouter()


@router.get("/")
def root():
    return {"status": "ok", "service": "Caturro Café API"}


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

    total_prob = sum(float(p.probabilidad) for p in promos)
    r = random.uniform(0, total_prob)
    acc = 0.0
    ganadora = promos[-1]
    for p in promos:
        acc += float(p.probabilidad)
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
