"""Cálculos de planificación: próximas fechas de recurrentes, gastos hormiga, suscripciones y puntaje Paz Mental.
Funciones puras sobre datos ya cargados para poder probarlas sin base de datos."""
import calendar
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Iterable, List, NamedTuple, Optional, Set

from app.services.ledger import money

# Umbral de "gasto hormiga" por moneda (montos pequeños y frecuentes)
SMALL_EXPENSE_THRESHOLD = {"DOP": Decimal("500"), "USD": Decimal("10"), "EUR": Decimal("10")}


class Tx(NamedTuple):
    description: str
    amount: Decimal
    date: date


def add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year, month = d.year + month_index // 12, month_index % 12 + 1
    return date(year, month, min(d.day, calendar.monthrange(year, month)[1]))


def next_occurrence(d: date, frequency: str) -> date:
    if frequency == "weekly":
        return d + timedelta(days=7)
    if frequency == "biweekly":
        return d + timedelta(days=14)
    if frequency == "yearly":
        return add_months(d, 12)
    return add_months(d, 1)


def occurrences_until(first: date, frequency: str, until: date, limit: int = 60) -> List[date]:
    """Fechas desde `first` (incluida) hasta `until` (incluida)."""
    dates, current = [], first
    while current <= until and len(dates) < limit:
        dates.append(current)
        current = next_occurrence(current, frequency)
    return dates


def _normalize(description: str) -> str:
    return " ".join(description.lower().split())


def small_expenses(expenses: Iterable[Tx], threshold: Decimal, top: int = 5) -> dict:
    groups: Dict[str, List[Decimal]] = defaultdict(list)
    labels: Dict[str, str] = {}
    for tx in expenses:
        if money(tx.amount) <= threshold:
            key = _normalize(tx.description)
            groups[key].append(money(tx.amount))
            labels.setdefault(key, tx.description.strip())
    ranked = sorted(groups.items(), key=lambda kv: sum(kv[1]), reverse=True)
    return {
        "threshold": float(threshold),
        "count": sum(len(v) for v in groups.values()),
        "total": float(sum((sum(v) for v in groups.values()), Decimal("0"))),
        "top": [{"description": labels[k], "count": len(v), "total": float(sum(v))} for k, v in ranked[:top]],
    }


def detect_subscriptions(expenses: Iterable[Tx], known: Set[str]) -> List[dict]:
    """Cargos que se repiten cada ~mes con monto casi igual (±10%) y que aún no están registrados como recurrentes."""
    groups: Dict[str, List[Tx]] = defaultdict(list)
    for tx in expenses:
        groups[_normalize(tx.description)].append(tx)

    found = []
    for key, txs in groups.items():
        if key in known or len(txs) < 2:
            continue
        txs.sort(key=lambda t: t.date)
        amounts = [money(t.amount) for t in txs]
        if max(amounts) > min(amounts) * Decimal("1.1"):
            continue
        gaps = [(b.date - a.date).days for a, b in zip(txs, txs[1:])]
        if all(25 <= g <= 35 for g in gaps):
            found.append({
                "description": txs[-1].description.strip(),
                "amount": float(amounts[-1]),
                "frequency": "monthly",
                "last_date": txs[-1].date,
                "source": "detected",
            })
    return found


def peace_score(
    income: Decimal,
    expenses: Decimal,
    budget_usage: List[Decimal],
    card_usage: List[Decimal],
    daily_allowance: Decimal,
) -> int:
    """0-100. Pondera ahorro del periodo, presupuestos sin exceder, uso de tarjetas y colchón diario."""
    savings = max(Decimal("0"), min(Decimal("1"), (income - expenses) / income)) if income > 0 else Decimal("0")
    budgets = (Decimal(sum(1 for u in budget_usage if u <= 1)) / len(budget_usage)) if budget_usage else Decimal("1")
    cards = (1 - min(Decimal("1"), sum(card_usage) / len(card_usage))) if card_usage else Decimal("1")
    buffer = Decimal("1") if daily_allowance > 0 else Decimal("0")
    score = Decimal("100") * (Decimal("0.35") * savings + Decimal("0.25") * budgets + Decimal("0.2") * cards + Decimal("0.2") * buffer)
    return int(score.quantize(Decimal("1")))


def goal_monthly_need(target: Decimal, saved: Decimal, target_date: Optional[date], today: date) -> Decimal:
    """Aporte mensual necesario para llegar a la meta en su fecha. Sin fecha -> 0 (no compromete el disponible)."""
    remaining = money(target) - money(saved)
    if remaining <= 0 or not target_date:
        return Decimal("0")
    months_left = max(1, -(-(target_date - today).days // 30))
    return money(remaining / months_left)
