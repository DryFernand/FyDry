from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.financial import Account, Transaction, Budget, Debt
from app.schemas.financial import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
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
    """Retrieve all accounts owned by the authenticated user."""
    return db.query(Account).filter(Account.user_id == current_user.id).all()


@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new financial account (bank, card, wallet, cash)."""
    account = Account(
        user_id=current_user.id,
        name=account_in.name,
        type=account_in.type,
        balance=account_in.balance,
        currency=account_in.currency,
        account_number=account_in.account_number,
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
    """Update an existing account owned by the user."""
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
# TRANSACTIONS CRUD (Expenses & Incomes)
# ==========================================
@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve transactions (filter by type='expense' or 'income')."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if type:
        query = query.filter(Transaction.type == type)
    return query.order_by(Transaction.created_at.desc()).all()


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new income or expense transaction."""
    tx = Transaction(
        user_id=current_user.id,
        account_id=tx_in.account_id,
        account_name=tx_in.account_name,
        type=tx_in.type,
        category=tx_in.category,
        description=tx_in.description,
        amount=tx_in.amount,
        date=tx_in.date,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/transactions/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: str,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing transaction."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id, Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")

    update_data = tx_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/transactions/{tx_id}")
def delete_transaction(
    tx_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a transaction."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id, Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")

    db.delete(tx)
    db.commit()
    return {"status": "success", "message": "Transacción eliminada exitosamente."}


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
    """Create or allocate a new category budget."""
    budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        allocated_amount=budget_in.allocated_amount,
        color=budget_in.color,
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
    """Update a budget limit."""
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
    """Delete a budget goal."""
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
    """Retrieve all debts/liabilities owned by the user."""
    return db.query(Debt).filter(Debt.user_id == current_user.id).all()


@router.post("/debts", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
def create_debt(
    debt_in: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new debt/liability record."""
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
    """Update an existing debt record."""
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
    """Delete a debt record."""
    debt = db.query(Debt).filter(
        Debt.id == debt_id, Debt.user_id == current_user.id
    ).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")

    db.delete(debt)
    db.commit()
    return {"status": "success", "message": "Deuda eliminada exitosamente."}
