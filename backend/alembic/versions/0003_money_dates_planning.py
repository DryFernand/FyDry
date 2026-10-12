"""Dinero exacto (NUMERIC), fechas reales (DATE), booleanos reales, enlaces deuda/divisa,
recurrentes y metas de ahorro.

Convierte datos existentes:
- Montos FLOAT -> NUMERIC(14,2) redondeando a centavos.
- Fechas texto -> DATE: 'AAAA-MM-DD...' se respeta; textos como 'Hoy' o '12 oct' toman la fecha de created_at.
- 'true'/'false' -> BOOLEAN.
- Se eliminan tokens de Gmail guardados en texto plano (no se usaban).

Solo PostgreSQL. Haz backup antes de `alembic upgrade head`.

Revision ID: 0003_money_dates_planning
Revises: 0002_auth_security
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_money_dates_planning"
down_revision: Union[str, None] = "0002_auth_security"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MONEY_COLUMNS = {
    "accounts": ["balance", "overdraft_limit", "credit_limit", "min_balance"],
    "expenses": ["amount"],
    "incomes": ["amount"],
    "movements": ["amount", "tax_amount"],
    "budgets": ["allocated_amount"],
    "debts": ["total_amount", "remaining_amount", "monthly_payment"],
}
DATE_TABLES = ["expenses", "incomes", "movements"]
BOOL_COLUMNS = {
    "email_integrations": {"is_active": "true"},
    "pending_notifications": {"is_read": "false", "is_processed": "false", "is_dismissed": "false"},
}
REDUNDANT_ID_INDEXES = [
    "accounts", "expenses", "incomes", "movements", "budgets", "debts",
    "email_integrations", "pending_notifications",
]


def upgrade() -> None:
    for table, columns in MONEY_COLUMNS.items():
        for col in columns:
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE NUMERIC(14,2) USING round({col}::numeric, 2)")
    op.execute("ALTER TABLE debts ALTER COLUMN interest_rate TYPE NUMERIC(7,3) USING round(interest_rate::numeric, 3)")
    for col in ("cutoff_day", "grace_days"):
        op.execute(f"ALTER TABLE accounts ALTER COLUMN {col} TYPE INTEGER USING round({col})::integer")
    op.execute("UPDATE accounts SET cutoff_day = LEAST(GREATEST(cutoff_day, 1), 31) WHERE cutoff_day IS NOT NULL")

    # Conversión tolerante de fechas texto
    op.execute("""
        CREATE OR REPLACE FUNCTION fydry_try_date(t text) RETURNS date AS $$
        BEGIN
            IF t ~ '^\\d{4}-\\d{2}-\\d{2}' THEN
                RETURN substring(t, 1, 10)::date;
            END IF;
            RETURN NULL;
        EXCEPTION WHEN others THEN
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE
    """)
    for table in DATE_TABLES:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN date TYPE DATE USING COALESCE(fydry_try_date(date), created_at::date)")
    op.execute("DROP FUNCTION fydry_try_date(text)")

    for table, columns in BOOL_COLUMNS.items():
        for col, default in columns.items():
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} DROP DEFAULT")
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE BOOLEAN USING (lower({col}) = 'true')")
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} SET DEFAULT {default}")

    op.drop_column("email_integrations", "access_token")
    op.drop_column("email_integrations", "refresh_token")

    op.add_column("expenses", sa.Column("debt_id", sa.String(length=36), nullable=True))
    op.create_foreign_key("fk_expenses_debt_id", "expenses", "debts", ["debt_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_expenses_debt_id", "expenses", ["debt_id"])
    op.add_column("movements", sa.Column("to_amount", sa.Numeric(14, 2), nullable=True))

    for table in REDUNDANT_ID_INDEXES:
        op.execute(f"DROP INDEX IF EXISTS ix_{table}_id")
    op.create_index("ix_expenses_user_date", "expenses", ["user_id", "date"])
    op.create_index("ix_incomes_user_date", "incomes", ["user_id", "date"])

    op.create_table(
        "recurring_transactions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=10), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("account_id", sa.String(length=36), sa.ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("account_name", sa.String(length=255), nullable=True),
        sa.Column("frequency", sa.String(length=20), nullable=False),
        sa.Column("next_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_recurring_transactions_user_id", "recurring_transactions", ["user_id"])

    op.create_table(
        "savings_goals",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("target_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("saved_amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("color", sa.String(length=50), nullable=False, server_default="bg-emerald-500"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_savings_goals_user_id", "savings_goals", ["user_id"])


def downgrade() -> None:
    op.drop_table("savings_goals")
    op.drop_table("recurring_transactions")
    op.drop_index("ix_incomes_user_date", table_name="incomes")
    op.drop_index("ix_expenses_user_date", table_name="expenses")
    op.drop_column("movements", "to_amount")
    op.drop_index("ix_expenses_debt_id", table_name="expenses")
    op.drop_constraint("fk_expenses_debt_id", "expenses", type_="foreignkey")
    op.drop_column("expenses", "debt_id")
    op.add_column("email_integrations", sa.Column("refresh_token", sa.String(length=1000), nullable=True))
    op.add_column("email_integrations", sa.Column("access_token", sa.String(length=1000), nullable=True))

    for table, columns in BOOL_COLUMNS.items():
        for col, default in columns.items():
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} DROP DEFAULT")
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE VARCHAR(10) USING (CASE WHEN {col} THEN 'true' ELSE 'false' END)")
    for table in DATE_TABLES:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN date TYPE VARCHAR(50) USING to_char(date, 'YYYY-MM-DD')")
    for col in ("cutoff_day", "grace_days"):
        op.execute(f"ALTER TABLE accounts ALTER COLUMN {col} TYPE DOUBLE PRECISION")
    op.execute("ALTER TABLE debts ALTER COLUMN interest_rate TYPE DOUBLE PRECISION")
    for table, columns in MONEY_COLUMNS.items():
        for col in columns:
            op.execute(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE DOUBLE PRECISION")
