from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.financial import Account, Expense, Income, Movement, Budget, Debt
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
)

router = APIRouter()


# ==========================================
# ACCOUNTS CRUD
# ==========================================
@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all accounts owned by the user."""
    return db.query(Account).filter(Account.user_id == current_user.id).all()


@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new financial account (Bank, Debit/Credit Card, Wallet, Cash, Savings)."""
    account = Account(
        user_id=current_user.id,
        name=account_in.name,
        type=account_in.type,
        balance=account_in.balance,
        currency=account_in.currency,
        account_number=account_in.account_number,
        card_number=account_in.card_number,
        cutoff_day=account_in.cutoff_day,
        grace_days=account_in.grace_days,
        overdraft_limit=account_in.overdraft_limit or 0.0,
        credit_limit=account_in.credit_limit or 0.0,
        min_balance=account_in.min_balance or 0.0,
    )
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
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada.")

    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
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
    """Delete an account owned by the user."""
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada.")

    db.delete(account)
    db.commit()
    return {"status": "success", "message": "Cuenta eliminada exitosamente."}


# ==========================================
# EXPENSES (Gastos) CRUD
# ==========================================
@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all expenses."""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.created_at.desc()).all()


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new expense and debit the amount from the chosen account."""
    account = None
    if exp_in.account_id:
        account = db.query(Account).filter(
            Account.id == exp_in.account_id, Account.user_id == current_user.id
        ).first()
    if not account and exp_in.account_name:
        account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(exp_in.account_name.strip()),
        ).first()

    account_id = account.id if account else exp_in.account_id
    account_name = account.name if account else (exp_in.account_name or "Efectivo Principal")

    # Debit balance from account
    if account:
        account.balance -= exp_in.amount

    expense = Expense(
        user_id=current_user.id,
        account_id=account_id,
        account_name=account_name,
        category=exp_in.category,
        description=exp_in.description,
        amount=exp_in.amount,
        date=exp_in.date,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


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

    # 1. Restore previous amount to old account
    old_account = None
    if expense.account_id:
        old_account = db.query(Account).filter(
            Account.id == expense.account_id, Account.user_id == current_user.id
        ).first()
    elif expense.account_name:
        old_account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(expense.account_name.strip()),
        ).first()

    if old_account:
        old_account.balance += expense.amount

    # 2. Update fields
    update_data = exp_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    # 3. Apply new debit to target account
    new_account = None
    if expense.account_id:
        new_account = db.query(Account).filter(
            Account.id == expense.account_id, Account.user_id == current_user.id
        ).first()
    elif expense.account_name:
        new_account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(expense.account_name.strip()),
        ).first()

    if new_account:
        new_account.balance -= expense.amount
        expense.account_id = new_account.id
        expense.account_name = new_account.name

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an expense and restore account balance."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")

    # Restore account balance
    account = None
    if expense.account_id:
        account = db.query(Account).filter(
            Account.id == expense.account_id, Account.user_id == current_user.id
        ).first()
    elif expense.account_name:
        account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(expense.account_name.strip()),
        ).first()

    if account:
        account.balance += expense.amount

    db.delete(expense)
    db.commit()
    return {"status": "success", "message": "Gasto eliminado exitosamente y saldo restaurado."}


# ==========================================
# INCOMES (Ingresos) CRUD
# ==========================================
@router.get("/incomes", response_model=List[IncomeResponse])
def get_incomes(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all incomes."""
    query = db.query(Income).filter(Income.user_id == current_user.id)
    if category:
        query = query.filter(Income.category == category)
    return query.order_by(Income.created_at.desc()).all()


@router.post("/incomes", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    inc_in: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new income and credit the amount to the chosen account."""
    account = None
    if inc_in.account_id:
        account = db.query(Account).filter(
            Account.id == inc_in.account_id, Account.user_id == current_user.id
        ).first()
    if not account and inc_in.account_name:
        account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(inc_in.account_name.strip()),
        ).first()

    account_id = account.id if account else inc_in.account_id
    account_name = account.name if account else (inc_in.account_name or "Efectivo Principal")

    # Credit balance to account
    if account:
        account.balance += inc_in.amount

    income = Income(
        user_id=current_user.id,
        account_id=account_id,
        account_name=account_name,
        category=inc_in.category,
        description=inc_in.description,
        amount=inc_in.amount,
        date=inc_in.date,
    )
    db.add(income)
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

    # 1. Deduct previous amount from old account
    old_account = None
    if income.account_id:
        old_account = db.query(Account).filter(
            Account.id == income.account_id, Account.user_id == current_user.id
        ).first()
    elif income.account_name:
        old_account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(income.account_name.strip()),
        ).first()

    if old_account:
        old_account.balance -= income.amount

    # 2. Update fields
    update_data = inc_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(income, field, value)

    # 3. Apply new credit to target account
    new_account = None
    if income.account_id:
        new_account = db.query(Account).filter(
            Account.id == income.account_id, Account.user_id == current_user.id
        ).first()
    elif income.account_name:
        new_account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(income.account_name.strip()),
        ).first()

    if new_account:
        new_account.balance += income.amount
        income.account_id = new_account.id
        income.account_name = new_account.name

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

    # Revert account balance
    account = None
    if income.account_id:
        account = db.query(Account).filter(
            Account.id == income.account_id, Account.user_id == current_user.id
        ).first()
    elif income.account_name:
        account = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(income.account_name.strip()),
        ).first()

    if account:
        account.balance -= income.amount

    db.delete(income)
    db.commit()
    return {"status": "success", "message": "Ingreso eliminado exitosamente y saldo ajustado."}


# ==========================================
# MOVEMENTS (Transferencias entre Cuentas) CRUD con Impuestos y Presupuestos
# ==========================================
@router.get("/movements", response_model=List[MovementResponse])
def get_movements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all account-to-account transfer movements."""
    return db.query(Movement).filter(
        Movement.user_id == current_user.id
    ).order_by(Movement.created_at.desc()).all()


@router.post("/movements", response_model=MovementResponse, status_code=status.HTTP_201_CREATED)
def create_movement(
    mov_in: MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a movement/transfer between two accounts with optional tax calculation and budget integration."""
    # Find from_account
    from_acc = None
    if mov_in.from_account_id:
        from_acc = db.query(Account).filter(
            Account.id == mov_in.from_account_id, Account.user_id == current_user.id
        ).first()
    if not from_acc and mov_in.from_account_name:
        from_acc = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(mov_in.from_account_name.strip()),
        ).first()

    # Find to_account
    to_acc = None
    if mov_in.to_account_id:
        to_acc = db.query(Account).filter(
            Account.id == mov_in.to_account_id, Account.user_id == current_user.id
        ).first()
    if not to_acc and mov_in.to_account_name:
        to_acc = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.name.ilike(mov_in.to_account_name.strip()),
        ).first()

    tax_val = max(0.0, float(mov_in.tax_amount or 0.0))
    total_debited = mov_in.amount + tax_val

    # Apply double accounting transfer (Origin pays amount + tax; Destination receives exact amount)
    if from_acc:
        from_acc.balance -= total_debited
    if to_acc:
        to_acc.balance += mov_in.amount

    from_name = from_acc.name if from_acc else (mov_in.from_account_name or "Cuenta Origen")
    to_name = to_acc.name if to_acc else (mov_in.to_account_name or "Cuenta Destino")

    # Always record the tax expense under the tax category so it computes in budget limits & alerts
    tax_expense_id = None
    if tax_val > 0:
        tax_budget = db.query(Budget).filter(
            Budget.user_id == current_user.id,
            Budget.category.ilike("%impuesto%"),
            ~Budget.category.ilike("%taxi%"),
            ~Budget.category.ilike("%transporte%"),
        ).first()

        category_name = tax_budget.category if (tax_budget and tax_budget.allocated_amount > 0) else "Impuestos & Tasas"

        tax_exp = Expense(
            user_id=current_user.id,
            account_id=from_acc.id if from_acc else None,
            account_name=from_name,
            category=category_name,
            description=f"Impuesto por traspaso {from_name} ➔ {to_name}",
            amount=tax_val,
            date=mov_in.date,
        )
        db.add(tax_exp)
        db.flush()
        tax_expense_id = tax_exp.id

    mov = Movement(
        user_id=current_user.id,
        from_account_id=from_acc.id if from_acc else mov_in.from_account_id,
        from_account_name=from_name,
        to_account_id=to_acc.id if to_acc else mov_in.to_account_id,
        to_account_name=to_name,
        amount=mov_in.amount,
        tax_amount=tax_val,
        tax_expense_id=tax_expense_id,
        description=mov_in.description or f"Traspaso de {from_name} a {to_name}",
        date=mov_in.date,
    )
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
    """Update a movement and recalculate balances of origin and destination accounts and budget tax expense."""
    mov = db.query(Movement).filter(
        Movement.id == mov_id, Movement.user_id == current_user.id
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado.")

    # 1. Revert previous transfer (including previous tax)
    prev_from = db.query(Account).filter(Account.id == mov.from_account_id).first() if mov.from_account_id else None
    prev_to = db.query(Account).filter(Account.id == mov.to_account_id).first() if mov.to_account_id else None
    if prev_from:
        prev_from.balance += (mov.amount + mov.tax_amount)
    if prev_to:
        prev_to.balance -= mov.amount

    # Remove previous tax expense if existed
    if mov.tax_expense_id:
        db.query(Expense).filter(Expense.id == mov.tax_expense_id).delete()
        mov.tax_expense_id = None

    # 2. Update fields
    update_data = mov_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(mov, field, value)

    # 3. Apply new transfer
    new_tax = max(0.0, float(mov.tax_amount or 0.0))
    mov.tax_amount = new_tax
    new_from = db.query(Account).filter(Account.id == mov.from_account_id).first() if mov.from_account_id else None
    new_to = db.query(Account).filter(Account.id == mov.to_account_id).first() if mov.to_account_id else None
    if new_from:
        new_from.balance -= (mov.amount + new_tax)
    if new_to:
        new_to.balance += mov.amount

    # Record updated tax expense
    if new_tax > 0:
        tax_budget = db.query(Budget).filter(
            Budget.user_id == current_user.id,
            Budget.category.ilike("%impuesto%"),
            ~Budget.category.ilike("%taxi%"),
            ~Budget.category.ilike("%transporte%"),
        ).first()
        category_name = tax_budget.category if (tax_budget and tax_budget.allocated_amount > 0) else "Impuestos & Tasas"
        tax_exp = Expense(
            user_id=current_user.id,
            account_id=new_from.id if new_from else None,
            account_name=new_from.name if new_from else mov.from_account_name,
            category=category_name,
            description=f"Impuesto por traspaso {mov.from_account_name} ➔ {mov.to_account_name}",
            amount=new_tax,
            date=mov.date,
        )
        db.add(tax_exp)
        db.flush()
        mov.tax_expense_id = tax_exp.id

    db.commit()
    db.refresh(mov)
    return mov


@router.delete("/movements/{mov_id}")
def delete_movement(
    mov_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a transfer movement, restore balances to origin and destination accounts and remove tax expense."""
    mov = db.query(Movement).filter(
        Movement.id == mov_id, Movement.user_id == current_user.id
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado.")

    # Revert transfer
    from_acc = db.query(Account).filter(Account.id == mov.from_account_id).first() if mov.from_account_id else None
    to_acc = db.query(Account).filter(Account.id == mov.to_account_id).first() if mov.to_account_id else None
    if from_acc:
        from_acc.balance += (mov.amount + mov.tax_amount)
    if to_acc:
        to_acc.balance -= mov.amount

    # Delete associated tax expense if existed
    if mov.tax_expense_id:
        db.query(Expense).filter(Expense.id == mov.tax_expense_id).delete()

    db.delete(mov)
    db.commit()
    return {"status": "success", "message": "Movimiento eliminado y saldos de ambas cuentas restaurados."}


# ==========================================
# BUDGETS CRUD
# ==========================================
@router.get("/budgets", response_model=List[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all budget allocations for the user."""
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()


@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new budget allocation."""
    budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        allocated_amount=budget_in.allocated_amount,
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

    update_data = budget_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
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
    return db.query(Debt).filter(Debt.user_id == current_user.id).all()


@router.post("/debts", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
def create_debt(
    debt_in: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new debt item."""
    debt = Debt(
        user_id=current_user.id,
        creditor=debt_in.creditor,
        type=debt_in.type,
        total_amount=debt_in.total_amount,
        remaining_amount=debt_in.remaining_amount,
        monthly_payment=debt_in.monthly_payment,
        interest_rate=debt_in.interest_rate,
        due_date=debt_in.due_date,
    )
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

    update_data = debt_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(debt, field, value)

    db.commit()
    db.refresh(debt)
    return debt


@router.delete("/debts/{debt_id}")
def delete_debt(
    debt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a debt item."""
    debt = db.query(Debt).filter(
        Debt.id == debt_id, Debt.user_id == current_user.id
    ).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")

    db.delete(debt)
    db.commit()
    return {"status": "success", "message": "Deuda eliminada exitosamente."}


# ==========================================
# RESET DATA (Zona de Peligro)
# ==========================================
@router.post("/reset-data", status_code=status.HTTP_200_OK)
def reset_financial_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reset all financial data for the authenticated user."""
    db.query(Expense).filter(Expense.user_id == current_user.id).delete()
    db.query(Income).filter(Income.user_id == current_user.id).delete()
    db.query(Movement).filter(Movement.user_id == current_user.id).delete()
    db.query(Budget).filter(Budget.user_id == current_user.id).delete()
    db.query(Debt).filter(Debt.user_id == current_user.id).delete()
    db.query(Account).filter(Account.user_id == current_user.id).delete()

    db.commit()
    return {
        "status": "success",
        "message": "Todos los datos financieros han sido restablecidos con éxito.",
    }
