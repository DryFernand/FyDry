"""Calculadora de quincena (historial) y tasa editable del impuesto DGII a transferencias.

Revision ID: 0004_planner_and_tax_rate
Revises: 0003_money_dates_planning
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_planner_and_tax_rate"
down_revision: Union[str, None] = "0003_money_dates_planning"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("transfer_tax_rate", sa.Numeric(6, 5), nullable=False, server_default="0.0015"),
    )
    op.create_table(
        "planner_snapshots",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("data", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_planner_snapshots_user_id", "planner_snapshots", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_planner_snapshots_user_id", table_name="planner_snapshots")
    op.drop_table("planner_snapshots")
    op.drop_column("user_profiles", "transfer_tax_rate")
