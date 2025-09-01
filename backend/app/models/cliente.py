from sqlalchemy import Column, Integer, String, TIMESTAMP, func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    cedula = Column(String(32), unique=True, index=True)
    password_hash = Column(String(255))
    nombre_completo = Column(String(255), nullable=False)
    semestre = Column(String(50), nullable=False)
    puntos = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())

    registros = relationship("RegistroRuleta", back_populates="cliente")
