import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Index
from app.core.database import Base
from app.models.base import TimestampMixin


class Category(Base, TimestampMixin):
    """Categoría de gasto o ingreso del usuario. Las transacciones guardan el nombre; renombrar actualiza todas."""
    __tablename__ = "categories"
    __table_args__ = (Index("ix_categories_user_kind", "user_id", "kind"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(10), nullable=False)  # "expense" | "income"
    name = Column(String(100), nullable=False)
    # Categorías con lógica propia (impuestos, deudas, ahorro...): se pueden renombrar pero no eliminar
    system_key = Column(String(30), nullable=True)
    position = Column(Integer, default=0, nullable=False)
