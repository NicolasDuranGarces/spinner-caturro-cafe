# ---------------- Schemas ----------------
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DECIMAL,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    func,
)
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
import os, random

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://caturro_user:caturro_pass_2024@mysql:3306/caturro_cafe",
)
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "caturro_admin_token_2024")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Caturro Café Underground API", version="1.0.0", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Models ----------------
class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(255), nullable=False)
    semestre = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())

    registros = relationship("RegistroRuleta", back_populates="cliente")


class Promocion(Base):
    __tablename__ = "promociones"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    probabilidad = Column(DECIMAL(5, 2), default=10.00)
    activa = Column(Boolean, default=True)
    color = Column(String(7), default="#4B5563")  # gris
    icono = Column(String(16), default="🎁")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())

    registros = relationship("RegistroRuleta", back_populates="promocion")


class RegistroRuleta(Base):
    __tablename__ = "registros_ruleta"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    promocion_id = Column(Integer, ForeignKey("promociones.id"))
    fecha_giro = Column(TIMESTAMP(timezone=True), server_default=func.now())

    cliente = relationship("Cliente", back_populates="registros")
    promocion = relationship("Promocion", back_populates="registros")


# Create tables if not exist (safe for first run)
Base.metadata.create_all(bind=engine)


# ---------------- Schemas ----------------
class ClienteCreate(BaseModel):
    nombre_completo: str
    semestre: str


class ClienteOut(BaseModel):
    id: int
    nombre_completo: str
    semestre: str

    class Config:
        from_attributes = True


class PromocionCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    probabilidad: float = 10.0
    activa: bool = True
    color: str = "#4B5563"
    icono: str = "🎁"


class PromocionOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    probabilidad: float
    activa: bool
    color: str
    icono: str

    class Config:
        from_attributes = True


class RuletaResult(BaseModel):
    promocion: PromocionOut
    mensaje: str


# ----------- New Schema for RegistroRuletaOut -----------
class RegistroRuletaOut(BaseModel):
    id: int
    cliente: ClienteOut
    promocion: PromocionOut
    fecha_giro: datetime

    class Config:
        from_attributes = True


# ----------- New Schema GiroRequest -----------
class GiroRequest(BaseModel):
    fecha_giro: datetime


# --------------- Utils -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_admin(x_admin_token: str = Header(..., alias="X-Admin-Token")):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token admin inválido")
    return True


# --------------- Routes -------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "Caturro Café API"}


# Clientes
@app.post("/clientes", response_model=ClienteOut)
def crear_cliente(payload: ClienteCreate, db: Session = Depends(get_db)):
    c = Cliente(
        nombre_completo=payload.nombre_completo.strip(),
        semestre=payload.semestre.strip(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@app.get("/clientes", response_model=List[ClienteOut])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).order_by(Cliente.id.desc()).all()


# Promociones (público: lectura; admin: escritura)
@app.get("/promociones", response_model=List[PromocionOut])
def listar_promociones(activas_solo: bool = True, db: Session = Depends(get_db)):
    q = db.query(Promocion)
    if activas_solo:
        q = q.filter(Promocion.activa == True)
    return q.order_by(Promocion.id.asc()).all()


@app.post(
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


@app.put(
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


@app.delete("/promociones/{promo_id}", dependencies=[Depends(require_admin)])
def eliminar_promocion(promo_id: int, db: Session = Depends(get_db)):
    promo = db.query(Promocion).filter_by(id=promo_id).first()
    if not promo:
        raise HTTPException(404, "Promoción no encontrada")

    db.delete(promo)
    db.commit()
    return {"ok": True}


# Girar ruleta (log + resultado)
@app.post("/ruleta/{cliente_id}", response_model=RuletaResult)
def girar_ruleta(cliente_id: int, payload: GiroRequest, db: Session = Depends(get_db)):
    print(
        "payload.fecha_giro",
        payload.fecha_giro,
    )
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
@app.get("/estadisticas")
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


# ------------- New Endpoint: /registros ---------------
from fastapi import Query
from sqlalchemy.orm import joinedload


@app.get("/registros", response_model=List[RegistroRuletaOut])
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
