"""auth security: intentos de OTP y revocación de tokens por cambio de contraseña

Revision ID: 0002_auth_security
Revises: 0001_baseline
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_auth_security"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("otp_codes", sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("password_changed_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_changed_at")
    op.drop_column("otp_codes", "attempts")
