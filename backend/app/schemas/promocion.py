from typing import Optional
from pydantic import BaseModel


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

