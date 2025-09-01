from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class SumarPuntosRequest(BaseModel):
    cedula: str
    puntos: int
    descripcion: Optional[str] = ""


class RedimirPuntosRequest(BaseModel):
    cedula: str
    puntos: int
    descripcion: Optional[str] = ""


class MovimientoOut(BaseModel):
    id: int
    cambio: int
    descripcion: str
    created_at: datetime

    class Config:
        from_attributes = True


class PuntosOut(BaseModel):
    cliente_id: int
    cedula: str
    puntos: int
    historial: List[MovimientoOut]
