from datetime import datetime
from pydantic import BaseModel
from .cliente import ClienteOut
from .promocion import PromocionOut


class RegistroRuletaOut(BaseModel):
    id: int
    cliente: ClienteOut
    promocion: PromocionOut
    fecha_giro: datetime

    class Config:
        from_attributes = True


class GiroRequest(BaseModel):
    fecha_giro: datetime


class RuletaResult(BaseModel):
    promocion: PromocionOut
    mensaje: str
