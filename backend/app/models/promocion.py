from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship
from ..core.database import Base


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

