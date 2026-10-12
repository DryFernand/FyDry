from collections import Counter
from datetime import date, timedelta
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.endpoints.financial import record_expense, record_income, _updates
from app.core.database import get_db
from app.models.financial import Account, Budget, Expense, Income
from app.models.planning import RecurringTransaction, SavingsGoal
from app.models.user import User
from app.schemas.planning import (
    GoalContribution,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    InsightsResponse,
    PostDueResult,
    RecurringCreate,
    RecurringResponse,
    RecurringUpdate,
)
from app.services.insights import (
    SMALL_EXPENSE_THRESHOLD,
    Tx,
    detect_subscriptions,
    goal_monthly_need,
    next_occurrence,
    occurrences_until,
    peace_score,
    small_expenses,
)
from app.services.ledger import LIABILITY_TYPES, budget_period, get_account, money

router = APIRouter()


# ==========================================
# RECURRING TRANSACTIONS
# ==========================================
def _get_recurring(db: Session, user_id: str, rec_id: str) -> RecurringTransaction:
    rec = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == rec_id, RecurringTransaction.user_id == user_id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurrente no encontrado.")
    return rec


def _resolve_account_fields(db: Session, user_id: str, rec: RecurringTransaction, account_id, account_name) -> None:
    account = get_account(db, user_id, account_id, account_name)
    rec.account_id = account.id if account else None
    rec.account_name = account.name if account else account_name


@router.get("/recurring", response_model=List[RecurringResponse])
def list_recurring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == current_user.id
    ).order_by(RecurringTransaction.next_date).all()


@router.post("/recurring", response_model=RecurringResponse, status_code=status.HTTP_201_CREATED)
def create_recurring(rec_in: RecurringCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = _updates(rec_in, nullable=frozenset({"account_id", "account_name"}), partial=False)
    account_id, account_name = data.pop("account_id", None), data.pop("account_name", None)
    rec = RecurringTransaction(user_id=current_user.id, **data)
    _resolve_account_fields(db, current_user.id, rec, account_id, account_name)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.put("/recurring/{rec_id}", response_model=RecurringResponse)
def update_recurring(rec_id: str, rec_in: RecurringUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rec = _get_recurring(db, current_user.id, rec_id)
    data = _updates(rec_in)
    if "account_id" in data or "account_name" in data:
        _resolve_account_fields(db, current_user.id, rec, data.pop("account_id", None), data.pop("account_name", None))
    for field, value in data.items():
        setattr(rec, field, value)
    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/recurring/{rec_id}")
def delete_recurring(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(_get_recurring(db, current_user.id, rec_id))
    db.commit()
    return {"status": "success", "message": "Recurrente eliminado."}


@router.post("/recurring/post-due", response_model=PostDueResult)
def post_due_recurring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Registra cada ocurrencia vencida (next_date <= hoy). Si una cuenta no tiene fondos, se detiene ahí y se reintenta luego."""
    today = date.today()
    posted, skipped = 0, []
    due = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == current_user.id,
        RecurringTransaction.is_active == True,
        RecurringTransaction.next_date <= today,
    ).all()
    for rec in due:
        record = record_expense if rec.kind == "expense" else record_income
        for occurrence in occurrences_until(rec.next_date, rec.frequency, today):
            try:
                record(db, current_user.id, rec.account_id, rec.account_name, rec.category,
                       rec.description, money(rec.amount), occurrence)
            except HTTPException:
                # ensure_funds valida antes de modificar saldos: no queda nada a medias
                skipped.append(f"{rec.description} ({occurrence.isoformat()})")
                break
            rec.next_date = next_occurrence(occurrence, rec.frequency)
            posted += 1
    db.commit()
    return PostDueResult(posted=posted, skipped=skipped)


# ==========================================
# SAVINGS GOALS
# ==========================================
def _get_goal(db: Session, user_id: str, goal_id: str) -> SavingsGoal:
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada.")
    return goal


@router.get("/goals", response_model=List[GoalResponse])
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at).all()


@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(goal_in: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = SavingsGoal(user_id=current_user.id, **_updates(goal_in, nullable=frozenset({"target_date"}), partial=False))
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: str, goal_in: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = _get_goal(db, current_user.id, goal_id)
    for field, value in _updates(goal_in, nullable=frozenset({"target_date"})).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.post("/goals/{goal_id}/contribute", response_model=GoalResponse)
def contribute_goal(goal_id: str, contrib: GoalContribution, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = _get_goal(db, current_user.id, goal_id)
    new_saved = money(goal.saved_amount) + money(contrib.amount)
    if new_saved < 0:
        raise HTTPException(status_code=400, detail="No puedes retirar más de lo ahorrado en la meta.")
    goal.saved_amount = new_saved
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(_get_goal(db, current_user.id, goal_id))
    db.commit()
    return {"status": "success", "message": "Meta eliminada."}


# ==========================================
# INSIGHTS: DISPONIBLE HOY, GASTOS HORMIGA, SUSCRIPCIONES, PAZ MENTAL
# ==========================================
@router.get("/insights", response_model=InsightsResponse)
def get_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Indicadores del periodo actual en la moneda principal del usuario (la más usada en sus cuentas).
    ponytail: transacciones de cuentas en otra moneda se excluyen; para consolidar haría falta tasa de cambio."""
    today = date.today()
    profile = current_user.profile
    start, end = budget_period(today, profile.budget_reset_day if profile else 1)
    days_left = (end - today).days + 1

    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    currency = (
        Counter(a.currency for a in accounts).most_common(1)[0][0]
        if accounts else (profile.preferred_currency if profile and profile.preferred_currency else "DOP")
    )

    def in_currency(model):
        return db.query(model).outerjoin(Account, model.account_id == Account.id).filter(
            model.user_id == current_user.id,
            or_(Account.currency == currency, model.account_id.is_(None)),
        )

    income = money(in_currency(Income).filter(Income.date.between(start, end)).with_entities(func.sum(Income.amount)).scalar())
    period_expenses = in_currency(Expense).filter(Expense.date.between(start, end))
    expenses = money(period_expenses.with_entities(func.sum(Expense.amount)).scalar())

    # Gastos fijos que aún caen en este periodo (recurrentes de gasto no asentados)
    recurring = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == current_user.id, RecurringTransaction.is_active == True
    ).all()
    fixed_pending = sum(
        (money(r.amount) * len(occurrences_until(r.next_date, r.frequency, end))
         for r in recurring if r.kind == "expense"),
        Decimal("0"),
    )

    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    goals_need = sum((goal_monthly_need(g.target_amount, g.saved_amount, g.target_date, today) for g in goals), Decimal("0"))

    # Disponible = dinero líquido (sin tarjetas ni cuentas de ahorro) − fijos pendientes − aporte a metas
    liquid = sum(
        (money(a.balance) for a in accounts
         if a.currency == currency and a.type not in LIABILITY_TYPES and a.type != "savings"),
        Decimal("0"),
    )
    available = max(Decimal("0"), liquid - fixed_pending - goals_need)
    daily = money(available / days_left)

    # Puntaje Paz Mental
    spent_by_category = dict(
        period_expenses.with_entities(func.lower(Expense.category), func.sum(Expense.amount))
        .group_by(func.lower(Expense.category)).all()
    )
    budget_usage = [
        money(spent_by_category.get(b.category.strip().lower())) / money(b.allocated_amount)
        for b in db.query(Budget).filter(Budget.user_id == current_user.id).all() if money(b.allocated_amount) > 0
    ]
    card_usage = [
        max(Decimal("0"), money(a.balance)) / money(a.credit_limit)
        for a in accounts if a.type in LIABILITY_TYPES and money(a.credit_limit) > 0
    ]
    score = peace_score(income, expenses, budget_usage, card_usage, daily)

    # Gastos hormiga (últimos 30 días) y suscripciones (recurrentes + detectadas en 120 días)
    recent = [
        Tx(e.description, e.amount, e.date)
        for e in in_currency(Expense).filter(Expense.date >= today - timedelta(days=120)).all()
    ]
    last_30 = [t for t in recent if t.date >= today - timedelta(days=30)]
    hormiga = small_expenses(last_30, SMALL_EXPENSE_THRESHOLD.get(currency, Decimal("10")))

    known = {" ".join(r.description.lower().split()) for r in recurring}
    subscriptions = [
        {"description": r.description, "amount": float(r.amount), "frequency": r.frequency,
         "last_date": None, "source": "recurring"}
        for r in recurring if r.kind == "expense"
    ] + detect_subscriptions(recent, known)

    return InsightsResponse(
        currency=currency,
        period_start=start,
        period_end=end,
        days_left=days_left,
        income_period=float(income),
        expenses_period=float(expenses),
        fixed_pending=float(fixed_pending),
        goals_monthly_need=float(goals_need),
        available_to_spend=float(available),
        daily_allowance=float(daily),
        peace_score=score,
        small_expenses=hormiga,
        subscriptions=subscriptions,
    )
