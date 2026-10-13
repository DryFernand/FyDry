from datetime import date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.financial import Account, Expense, Income, Movement, Budget, Debt, PendingNotification
from app.models.planning import RecurringTransaction, SavingsGoal
from app.services.ledger import money, get_account, apply_delta, ensure_funds, ensure_can_receive, LIABILITY_TYPES
from app.schemas.financial import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    IncomeCreate,
    IncomeUpdate,
    IncomeResponse,
    MovementCreate,
    MovementUpdate,
    MovementResponse,
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    DebtCreate,
    DebtUpdate,
    DebtResponse,
    DebtPaymentRequest,
    CardPaymentRequest,
)

router = APIRouter()

MONEY_FIELDS = {
    "amount", "to_amount", "tax_amount", "balance", "overdraft_limit", "credit_limit", "min_balance",
    "allocated_amount", "total_amount", "remaining_amount", "monthly_payment",
}
TAX_CATEGORY = "Impuestos & Tasas"
DEBT_CATEGORY = "Pago de Deudas & Préstamos"


def _updates(model_in, nullable: frozenset = frozenset(), partial: bool = True) -> dict:
    """Campos enviados por el cliente (o todos con defaults si partial=False).
    Un null explícito solo se acepta en columnas anulables; montos a Decimal."""
    data = {}
    for key, value in model_in.model_dump(exclude_unset=partial).items():
        if value is None and key not in nullable:
            continue
        if key in MONEY_FIELDS and value is not None:
            value = money(value)
        data[key] = value
    return data


def _date_window(query, column, from_date: Optional[date], to_date: Optional[date], limit: Optional[int], offset: int):
    if from_date:
        query = query.filter(column >= from_date)
    if to_date:
        query = query.filter(column <= to_date)
    query = query.offset(offset)
    return query.limit(limit) if limit else query


# ==========================================
# ACCOUNTS CRUD
# ==========================================
@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all accounts owned by the user."""
    return db.query(Account).filter(Account.user_id == current_user.id).order_by(Account.created_at).all()


@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new financial account (Bank, Debit/Credit Card, Wallet, Cash, Savings)."""
    data = _updates(account_in, nullable=frozenset({"account_number", "card_number", "cutoff_day", "grace_days"}), partial=False)
    account = Account(user_id=current_user.id, **data)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/accounts/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: str,
    account_in: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing financial account."""
    account = get_account(db, current_user.id, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada.")

    data = _updates(account_in, nullable=frozenset({"account_number", "card_number", "cutoff_day", "grace_days"}))
    for field, value in data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete("/accounts/{account_id}")
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an account owned by the user. Its transactions keep the account name for history."""
    account = get_account(db, current_user.id, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada.")

    db.delete(account)
    db.commit()
    return {"status": "success", "message": "Cuenta eliminada exitosamente."}


@router.post("/accounts/{card_id}/pay", response_model=MovementResponse, status_code=status.HTTP_201_CREATED)
def pay_credit_card(
    card_id: str,
    pay_in: CardPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Paga una tarjeta de crédito desde una cuenta propia. Se registra como traspaso para conservar el historial."""
    card = get_account(db, current_user.id, card_id)
    if not card or card.type not in LIABILITY_TYPES:
        raise HTTPException(status_code=404, detail="Tarjeta de crédito no encontrada.")

    source = get_account(db, current_user.id, pay_in.from_account_id, pay_in.from_account_name)
    if not source:
        raise HTTPException(status_code=400, detail="Selecciona la cuenta desde la que pagas la tarjeta.")
    if source.type in LIABILITY_TYPES:
        raise HTTPException(status_code=400, detail="No puedes pagar una tarjeta con otra tarjeta de crédito.")
    if source.currency != card.currency:
        raise HTTPException(
            status_code=400,
            detail=f"La tarjeta está en {card.currency} y la cuenta en {source.currency}. Paga desde una cuenta en {card.currency}.",
        )

    amount = money(pay_in.amount)
    owed = money(card.balance)
    if owed <= 0:
        raise HTTPException(status_code=400, detail=f"La tarjeta '{card.name}' no tiene saldo pendiente.")
    if amount > owed:
        raise HTTPException(
            status_code=400,
            detail=f"El pago ({amount:,.2f}) supera el saldo pendiente de la tarjeta ({owed:,.2f}).",
        )

    mov = Movement(
        user_id=current_user.id,
        from_account_name=source.name,
        to_account_name=card.name,
        amount=amount,
        tax_amount=Decimal("0"),
        description=pay_in.description or f"Pago de tarjeta {card.name}",
        date=pay_in.date or date.today(),
    )
    _apply_movement(db, current_user.id, mov, source, card)
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


# ==========================================
# EXPENSES (Gastos) CRUD
# ==========================================
@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: Optional[int] = Query(None, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve expenses, newest first. Optional date range and pagination."""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    query = query.order_by(Expense.date.desc(), Expense.created_at.desc())
    return _date_window(query, Expense.date, from_date, to_date, limit, offset).all()


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new expense and debit the amount from the chosen account."""
    expense = record_expense(db, current_user.id, exp_in.account_id, exp_in.account_name, exp_in.category,
                             exp_in.description, money(exp_in.amount), exp_in.date)
    db.commit()
    db.refresh(expense)
    return expense


def record_expense(db: Session, user_id: str, account_id, account_name, category, description, amount: Decimal, when: date) -> Expense:
    """Crea un gasto aplicando su efecto en la cuenta (sin commit). Reutilizado por recurrentes."""
    account = get_account(db, user_id, account_id, account_name)
    if account:
        ensure_funds(account, amount)
        apply_delta(account, -amount)
    expense = Expense(
        user_id=user_id,
        account_id=account.id if account else None,
        account_name=account.name if account else (account_name or "Efectivo Principal"),
        category=category,
        description=description,
        amount=amount,
        date=when,
    )
    db.add(expense)
    return expense


def record_income(db: Session, user_id: str, account_id, account_name, category, description, amount: Decimal, when: date) -> Income:
    """Crea un ingreso aplicando su efecto en la cuenta (sin commit). Reutilizado por recurrentes."""
    account = get_account(db, user_id, account_id, account_name)
    ensure_can_receive(account)
    if account:
        apply_delta(account, amount)
    income = Income(
        user_id=user_id,
        account_id=account.id if account else None,
        account_name=account.name if account else (account_name or "Efectivo Principal"),
        category=category,
        description=description,
        amount=amount,
        date=when,
    )
    db.add(income)
    return income


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    exp_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing expense and adjust account balance."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")

    data = _updates(exp_in)
    account_changed = "account_id" in data or "account_name" in data

    is_tax = db.query(Movement).filter(Movement.tax_expense_id == expense.id).first() is not None
    if is_tax and ("amount" in data or account_changed):
        raise HTTPException(status_code=400, detail="Este gasto es el impuesto de un traspaso. Edita el monto desde el traspaso.")

    old_amount = money(expense.amount)
    new_amount = data.get("amount", old_amount)

    # 1. Revertir efecto anterior
    old_account = get_account(db, current_user.id, expense.account_id) if expense.account_id else None
    if old_account:
        apply_delta(old_account, old_amount)

    # 2. Abono a deuda: el saldo pendiente sigue al monto del gasto
    if expense.debt_id and new_amount != old_amount:
        debt = db.query(Debt).filter(Debt.id == expense.debt_id, Debt.user_id == current_user.id).first()
        if debt:
            remaining = money(debt.remaining_amount) + old_amount - new_amount
            if remaining < 0:
                raise HTTPException(status_code=400, detail="El abono supera el saldo pendiente de la deuda.")
            debt.remaining_amount = remaining

    # 3. Actualizar campos
    for field in ("category", "description", "amount", "date"):
        if field in data:
            setattr(expense, field, data[field])

    # 4. Aplicar a la cuenta destino
    new_account = get_account(db, current_user.id, data.get("account_id"), data.get("account_name")) if account_changed else old_account
    if new_account:
        ensure_funds(new_account, new_amount)
        apply_delta(new_account, -new_amount)
        expense.account_id = new_account.id
        expense.account_name = new_account.name
    elif account_changed:
        expense.account_id = None
        expense.account_name = data.get("account_name") or expense.account_name

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an expense and restore account balance (and debt / transfer tax links)."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")

    amount = money(expense.amount)
    account = get_account(db, current_user.id, expense.account_id) if expense.account_id else None
    if account:
        apply_delta(account, amount)

    if expense.debt_id:
        debt = db.query(Debt).filter(Debt.id == expense.debt_id, Debt.user_id == current_user.id).first()
        if debt:
            debt.remaining_amount = min(money(debt.total_amount), money(debt.remaining_amount) + amount)

    # Si era el impuesto de un traspaso, el traspaso deja de tener impuesto (evita doble reembolso)
    for mov in db.query(Movement).filter(Movement.tax_expense_id == expense.id).all():
        mov.tax_amount = Decimal("0")
        mov.tax_expense_id = None

    db.delete(expense)
    db.commit()
    return {"status": "success", "message": "Gasto eliminado exitosamente y saldo restaurado."}


# ==========================================
# INCOMES (Ingresos) CRUD
# ==========================================
@router.get("/incomes", response_model=List[IncomeResponse])
def get_incomes(
    category: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: Optional[int] = Query(None, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve incomes, newest first. Optional date range and pagination."""
    query = db.query(Income).filter(Income.user_id == current_user.id)
    if category:
        query = query.filter(Income.category == category)
    query = query.order_by(Income.date.desc(), Income.created_at.desc())
    return _date_window(query, Income.date, from_date, to_date, limit, offset).all()


@router.post("/incomes", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    inc_in: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new income and credit the amount to the chosen account."""
    income = record_income(db, current_user.id, inc_in.account_id, inc_in.account_name, inc_in.category,
                           inc_in.description, money(inc_in.amount), inc_in.date)
    db.commit()
    db.refresh(income)
    return income


@router.put("/incomes/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: str,
    inc_in: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing income and adjust account balance."""
    income = db.query(Income).filter(
        Income.id == income_id, Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")

    data = _updates(inc_in)
    account_changed = "account_id" in data or "account_name" in data

    old_account = get_account(db, current_user.id, income.account_id) if income.account_id else None
    if old_account:
        apply_delta(old_account, -money(income.amount))

    for field in ("category", "description", "amount", "date"):
        if field in data:
            setattr(income, field, data[field])

    new_account = get_account(db, current_user.id, data.get("account_id"), data.get("account_name")) if account_changed else old_account
    if account_changed:
        ensure_can_receive(new_account)
    if new_account:
        apply_delta(new_account, money(income.amount))
        income.account_id = new_account.id
        income.account_name = new_account.name
    elif account_changed:
        income.account_id = None
        income.account_name = data.get("account_name") or income.account_name

    db.commit()
    db.refresh(income)
    return income


@router.delete("/incomes/{income_id}")
def delete_income(
    income_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an income and deduct amount from account balance."""
    income = db.query(Income).filter(
        Income.id == income_id, Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")

    account = get_account(db, current_user.id, income.account_id) if income.account_id else None
    if account:
        apply_delta(account, -money(income.amount))

    db.delete(income)
    db.commit()
    return {"status": "success", "message": "Ingreso eliminado exitosamente y saldo ajustado."}


# ==========================================
# MOVEMENTS (Transferencias entre Cuentas) CRUD con Impuestos y Presupuestos
# ==========================================
def _tax_category(db: Session, user_id: str) -> str:
    tax_budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category.ilike("%impuesto%"),
    ).first()
    return tax_budget.category if (tax_budget and money(tax_budget.allocated_amount) > 0) else TAX_CATEGORY


def _apply_movement(db: Session, user_id: str, mov: Movement, from_acc: Optional[Account], to_acc: Optional[Account]) -> None:
    """Aplica el traspaso: origen paga monto + impuesto; destino recibe to_amount (o el mismo monto). Registra el impuesto como gasto."""
    if from_acc and to_acc and from_acc.id == to_acc.id:
        raise HTTPException(status_code=400, detail="La cuenta de origen y destino no pueden ser la misma.")

    amount = money(mov.amount)
    tax = money(mov.tax_amount)
    if from_acc and to_acc and from_acc.currency != to_acc.currency and mov.to_amount is None:
        raise HTTPException(
            status_code=400,
            detail=f"Las cuentas usan monedas distintas ({from_acc.currency} → {to_acc.currency}). Indica el monto recibido en destino.",
        )
    received = money(mov.to_amount) if mov.to_amount is not None else amount

    if from_acc:
        ensure_funds(from_acc, amount + tax)
        apply_delta(from_acc, -(amount + tax))
        mov.from_account_id = from_acc.id
        mov.from_account_name = from_acc.name
    if to_acc:
        apply_delta(to_acc, received)
        mov.to_account_id = to_acc.id
        mov.to_account_name = to_acc.name

    mov.tax_expense_id = None
    if tax > 0:
        tax_exp = Expense(
            user_id=user_id,
            account_id=from_acc.id if from_acc else None,
            account_name=mov.from_account_name,
            category=_tax_category(db, user_id),
            description=f"Impuesto por traspaso {mov.from_account_name} ➔ {mov.to_account_name}",
            amount=tax,
            date=mov.date,
        )
        db.add(tax_exp)
        db.flush()
        mov.tax_expense_id = tax_exp.id


def _revert_movement(db: Session, user_id: str, mov: Movement) -> None:
    from_acc = get_account(db, user_id, mov.from_account_id) if mov.from_account_id else None
    to_acc = get_account(db, user_id, mov.to_account_id) if mov.to_account_id else None
    if from_acc:
        apply_delta(from_acc, money(mov.amount) + money(mov.tax_amount))
    if to_acc:
        apply_delta(to_acc, -(money(mov.to_amount) if mov.to_amount is not None else money(mov.amount)))
    if mov.tax_expense_id:
        db.query(Expense).filter(Expense.id == mov.tax_expense_id, Expense.user_id == user_id).delete()
        mov.tax_expense_id = None


@router.get("/movements", response_model=List[MovementResponse])
def get_movements(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: Optional[int] = Query(None, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve account-to-account transfer movements, newest first."""
    query = db.query(Movement).filter(Movement.user_id == current_user.id).order_by(Movement.date.desc(), Movement.created_at.desc())
    return _date_window(query, Movement.date, from_date, to_date, limit, offset).all()


@router.post("/movements", response_model=MovementResponse, status_code=status.HTTP_201_CREATED)
def create_movement(
    mov_in: MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a movement/transfer between two accounts with optional tax and currency conversion."""
    from_acc = get_account(db, current_user.id, mov_in.from_account_id, mov_in.from_account_name)
    to_acc = get_account(db, current_user.id, mov_in.to_account_id, mov_in.to_account_name)
    ensure_can_receive(to_acc, "traspasos")
    from_name = from_acc.name if from_acc else (mov_in.from_account_name or "Cuenta Origen")
    to_name = to_acc.name if to_acc else (mov_in.to_account_name or "Cuenta Destino")

    mov = Movement(
        user_id=current_user.id,
        from_account_name=from_name,
        to_account_name=to_name,
        amount=money(mov_in.amount),
        to_amount=money(mov_in.to_amount) if mov_in.to_amount is not None else None,
        tax_amount=money(mov_in.tax_amount),
        description=mov_in.description or f"Traspaso de {from_name} a {to_name}",
        date=mov_in.date,
    )
    _apply_movement(db, current_user.id, mov, from_acc, to_acc)
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@router.put("/movements/{mov_id}", response_model=MovementResponse)
def update_movement(
    mov_id: str,
    mov_in: MovementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a movement: revert its previous effect and apply the new one."""
    mov = db.query(Movement).filter(
        Movement.id == mov_id, Movement.user_id == current_user.id
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado.")

    data = _updates(mov_in, nullable=frozenset({"to_amount"}))

    def resolve(side: str) -> Optional[Account]:
        acc_id, acc_name = data.get(f"{side}_account_id"), data.get(f"{side}_account_name")
        if acc_id or acc_name:
            acc = get_account(db, current_user.id, acc_id, acc_name)
            if not acc:
                raise HTTPException(status_code=404, detail="Cuenta no encontrada o no pertenece al usuario.")
            return acc
        current_id = getattr(mov, f"{side}_account_id")
        return get_account(db, current_user.id, current_id) if current_id else None

    from_acc, to_acc = resolve("from"), resolve("to")
    # Cambiar el destino a una tarjeta no está permitido (los pagos de tarjeta ya existentes sí se pueden editar)
    if ("to_account_id" in data or "to_account_name" in data) and to_acc and to_acc.id != mov.to_account_id:
        ensure_can_receive(to_acc, "traspasos")

    _revert_movement(db, current_user.id, mov)
    for field in ("amount", "to_amount", "tax_amount", "description", "date"):
        if field in data:
            setattr(mov, field, data[field])
    _apply_movement(db, current_user.id, mov, from_acc, to_acc)

    db.commit()
    db.refresh(mov)
    return mov


@router.delete("/movements/{mov_id}")
def delete_movement(
    mov_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a transfer movement, restore balances and remove its tax expense."""
    mov = db.query(Movement).filter(
        Movement.id == mov_id, Movement.user_id == current_user.id
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado.")

    _revert_movement(db, current_user.id, mov)
    db.delete(mov)
    db.commit()
    return {"status": "success", "message": "Movimiento eliminado y saldos de ambas cuentas restaurados."}


# ==========================================
# BUDGETS CRUD
# ==========================================
def _ensure_unique_budget(db: Session, user_id: str, category: str, exclude_id: Optional[str] = None) -> None:
    query = db.query(Budget).filter(Budget.user_id == user_id, func.lower(Budget.category) == category.strip().lower())
    if exclude_id:
        query = query.filter(Budget.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=409, detail=f"Ya tienes un presupuesto para '{category}'.")


@router.get("/budgets", response_model=List[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all budget allocations for the user."""
    return db.query(Budget).filter(Budget.user_id == current_user.id).order_by(Budget.created_at).all()


@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new monthly budget allocation (one per category)."""
    _ensure_unique_budget(db, current_user.id, budget_in.category)
    budget = Budget(
        user_id=current_user.id,
        category=budget_in.category.strip(),
        allocated_amount=money(budget_in.allocated_amount),
        color=budget_in.color or "bg-zinc-900",
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a budget allocation."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id, Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")

    data = _updates(budget_in)
    if "category" in data:
        _ensure_unique_budget(db, current_user.id, data["category"], exclude_id=budget.id)
    for field, value in data.items():
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a budget allocation."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id, Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")

    db.delete(budget)
    db.commit()
    return {"status": "success", "message": "Presupuesto eliminado exitosamente."}


# ==========================================
# DEBTS CRUD
# ==========================================
@router.get("/debts", response_model=List[DebtResponse])
def get_debts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all debts registered by the user."""
    return db.query(Debt).filter(Debt.user_id == current_user.id).order_by(Debt.created_at).all()


@router.post("/debts", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
def create_debt(
    debt_in: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new debt item."""
    if debt_in.remaining_amount > debt_in.total_amount:
        raise HTTPException(status_code=400, detail="El saldo pendiente no puede superar el monto total.")
    debt = Debt(user_id=current_user.id, **_updates(debt_in, partial=False))
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


@router.put("/debts/{debt_id}", response_model=DebtResponse)
def update_debt(
    debt_id: str,
    debt_in: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a debt item."""
    debt = db.query(Debt).filter(
        Debt.id == debt_id, Debt.user_id == current_user.id
    ).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")

    for field, value in _updates(debt_in).items():
        setattr(debt, field, value)
    if money(debt.remaining_amount) > money(debt.total_amount):
        raise HTTPException(status_code=400, detail="El saldo pendiente no puede superar el monto total.")

    db.commit()
    db.refresh(debt)
    return debt


@router.delete("/debts/{debt_id}")
def delete_debt(
    debt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a debt item. Past payment expenses are kept (unlinked)."""
    debt = db.query(Debt).filter(
        Debt.id == debt_id, Debt.user_id == current_user.id
    ).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")

    db.query(Expense).filter(Expense.debt_id == debt.id).update({"debt_id": None})
    db.delete(debt)
    db.commit()
    return {"status": "success", "message": "Deuda eliminada exitosamente."}


@router.post("/debts/{debt_id}/pay", response_model=DebtResponse)
def pay_debt(
    debt_id: str,
    pay_in: DebtPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pay/amortize a debt: deduct from chosen account, reduce remaining amount, and record a linked expense."""
    debt = db.query(Debt).filter(
        Debt.id == debt_id, Debt.user_id == current_user.id
    ).with_for_update().first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")

    amount = money(pay_in.amount)
    if amount > money(debt.remaining_amount):
        raise HTTPException(
            status_code=400,
            detail=f"El abono ({amount:,.2f}) supera el saldo pendiente ({money(debt.remaining_amount):,.2f}).",
        )

    expense = record_expense(
        db, current_user.id, pay_in.account_id, pay_in.account_name, DEBT_CATEGORY,
        pay_in.description or f"Abono a {debt.creditor} ({debt.type})", amount, pay_in.date or date.today(),
    )
    expense.debt_id = debt.id
    debt.remaining_amount = money(debt.remaining_amount) - amount

    db.commit()
    db.refresh(debt)
    return debt


# ==========================================
# RESET DATA (Zona de Peligro)
# ==========================================
@router.post("/reset-data", status_code=status.HTTP_200_OK)
def reset_financial_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reset all financial data for the authenticated user."""
    for model in (Movement, Expense, Income, Budget, Debt, RecurringTransaction, SavingsGoal, PendingNotification, Account):
        db.query(model).filter(model.user_id == current_user.id).delete(synchronize_session=False)

    db.commit()
    return {
        "status": "success",
        "message": "Todos los datos financieros han sido restablecidos con éxito.",
    }
