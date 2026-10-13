"""Reglas contables compartidas: dinero exacto, búsqueda de cuentas y efecto de cada operación en saldos."""
import calendar
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.financial import Account

CENT = Decimal("0.01")
# Cuentas pasivo: su saldo es lo CONSUMIDO (deuda). Un gasto lo aumenta, un pago lo reduce.
LIABILITY_TYPES = {"credit_card"}


def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def get_account(db: Session, user_id: str, account_id: Optional[str] = None, account_name: Optional[str] = None) -> Optional[Account]:
    """Busca por id y, si no, por nombre exacto (sin distinguir mayúsculas). Bloquea la fila para la transacción."""
    query = db.query(Account).filter(Account.user_id == user_id).with_for_update()
    if account_id:
        account = query.filter(Account.id == account_id).first()
        if account:
            return account
    if account_name and account_name.strip():
        return query.filter(func.lower(Account.name) == account_name.strip().lower()).first()
    return None


def apply_delta(account: Account, delta: Decimal) -> None:
    """delta = efecto sobre el dinero del usuario (+ entra, - sale)."""
    if account.type in LIABILITY_TYPES:
        account.balance = money(account.balance) - delta
    else:
        account.balance = money(account.balance) + delta


def ensure_can_receive(account: Optional[Account], what: str = "ingresos") -> None:
    """Una tarjeta de crédito solo baja su consumo con 'Pagar tarjeta', nunca con ingresos ni traspasos."""
    if account is not None and account.type in LIABILITY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La tarjeta '{account.name}' no puede recibir {what}. Para abonarle usa la opción 'Pagar tarjeta'.",
        )


def ensure_funds(account: Account, outflow: Decimal) -> None:
    """Rechaza un egreso que exceda el crédito disponible (tarjeta con límite) o el saldo + sobregiro (cuenta)."""
    overdraft = money(account.overdraft_limit)
    if account.type in LIABILITY_TYPES:
        limit = money(account.credit_limit) + overdraft
        if limit > 0 and money(account.balance) + outflow > limit:
            available = limit - money(account.balance)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transacción rechazada: el monto ({outflow:,.2f}) supera el crédito disponible ({available:,.2f}) de la tarjeta '{account.name}'.",
            )
    elif money(account.balance) - outflow < -overdraft:
        available = money(account.balance) + overdraft
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transacción rechazada: el monto ({outflow:,.2f}) supera el saldo más el sobregiro ({available:,.2f}) de la cuenta '{account.name}'.",
        )


def budget_period(today: date, reset_day: int = 1) -> Tuple[date, date]:
    """Periodo de presupuesto [inicio, fin] que contiene `today`, iniciando el día `reset_day` de cada mes."""
    reset_day = min(max(int(reset_day or 1), 1), 31)

    def anchor(year: int, month: int) -> date:
        return date(year, month, min(reset_day, calendar.monthrange(year, month)[1]))

    start = anchor(today.year, today.month)
    if today < start:
        prev_year, prev_month = (today.year - 1, 12) if today.month == 1 else (today.year, today.month - 1)
        start = anchor(prev_year, prev_month)
    next_year, next_month = (start.year + 1, 1) if start.month == 12 else (start.year, start.month + 1)
    end = anchor(next_year, next_month) - timedelta(days=1)
    return start, end
