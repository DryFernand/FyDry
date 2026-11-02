"""Traspasos a ahorro: elegir si cuentan en el presupuesto "Ahorro Programado".

Revision ID: 0005_movement_affects_budget
Revises: 0004_planner_and_tax_rate
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_movement_affects_budget"
down_revision: Union[str, None] = "0004_planner_and_tax_rate"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("movements", sa.Column("affects_budget", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    op.drop_column("movements", "affects_budget")
