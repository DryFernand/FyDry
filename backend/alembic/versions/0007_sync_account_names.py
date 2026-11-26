"""Sincroniza el nombre de la cuenta guardado en gastos, ingresos, recurrentes y traspasos.

Antes, renombrar una cuenta no actualizaba ese nombre; al editar un gasto viejo el frontend lo reenviaba,
no se encontraba la cuenta y el gasto dejaba de afectar el saldo. Desde ahora el backend lo mantiene al día.

Revision ID: 0007_sync_account_names
Revises: 0006_user_categories
"""
from typing import Sequence, Union

from alembic import op


revision: str = "0007_sync_account_names"
down_revision: Union[str, None] = "0006_user_categories"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (tabla, columna del id de la cuenta, columna del nombre)
REFS = [
    ("expenses", "account_id", "account_name"),
    ("incomes", "account_id", "account_name"),
    ("recurring_transactions", "account_id", "account_name"),
    ("movements", "from_account_id", "from_account_name"),
    ("movements", "to_account_id", "to_account_name"),
]


def upgrade() -> None:
    for table, id_col, name_col in REFS:
        current = f"(SELECT accounts.name FROM accounts WHERE accounts.id = {table}.{id_col})"
        op.execute(
            f"UPDATE {table} SET {name_col} = {current} "
            f"WHERE {id_col} IS NOT NULL AND ({name_col} IS NULL OR {name_col} <> {current})"
        )


def downgrade() -> None:
    # Solo corrige datos: no hay nada que deshacer
    pass
