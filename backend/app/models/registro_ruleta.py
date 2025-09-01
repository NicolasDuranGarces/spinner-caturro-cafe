from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from ..core.database import Base


class RegistroRuleta(Base):
    __tablename__ = "registros_ruleta"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    promocion_id = Column(Integer, ForeignKey("promociones.id"))
    fecha_giro = Column(TIMESTAMP(timezone=True), server_default=func.now())

    cliente = relationship("Cliente", back_populates="registros")
    promocion = relationship("Promocion", back_populates="registros")

