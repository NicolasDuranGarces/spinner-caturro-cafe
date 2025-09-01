from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from ..core.database import Base


class MovimientoPuntos(Base):
    __tablename__ = "movimientos_puntos"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    cambio = Column(Integer, nullable=False)  # positivo: suma, negativo: resta
    descripcion = Column(String(255), default="")
    created_at = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente")

