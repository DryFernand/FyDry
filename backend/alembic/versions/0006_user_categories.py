"""Categorías personalizables por usuario (renombrar, crear, eliminar).

Revision ID: 0006_user_categories
Revises: 0005_movement_affects_budget
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_user_categories"
down_revision: Union[str, None] = "0005_movement_affects_budget"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Se llena por usuario la primera vez que la app pide sus categorías (GET /categories)
    op.create_table(
        "categories",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=10), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("system_key", sa.String(length=30), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_categories_user_id", "categories", ["user_id"])
    op.create_index("ix_categories_user_kind", "categories", ["user_id", "kind"])


def downgrade() -> None:
    op.drop_index("ix_categories_user_kind", table_name="categories")
    op.drop_index("ix_categories_user_id", table_name="categories")
    op.drop_table("categories")
