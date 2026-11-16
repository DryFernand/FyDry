"""Categorías por usuario: valores por defecto, renombrado en cascada y nombres de las categorías con lógica propia."""
from typing import Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.financial import Budget, Expense, Income
from app.models.planning import RecurringTransaction

# Mismas listas que frontend/lib/categories.ts: son las categorías con las que arranca cada usuario
DEFAULT_EXPENSE = [
    "Vivienda & Alquiler", "Supermercado & Alimentación", "Restaurantes & Bares", "Servicios Públicos (Luz/Agua/Gas)",
    "Telefonía & Internet", "Gasolina & Combustible", "Transporte Público & Taxi", "Salud & Farmacia",
    "Seguros & Pólizas", "Gimnasio & Deporte", "Ropa & Calzado", "Cuidado Personal & Barbería", "Educación & Cursos",
    "Entretenimiento & Cine", "Suscripciones Digitales", "Viajes & Vacaciones", "Mascotas & Veterinario",
    "Tecnología & Gadgets", "Mantenimiento del Hogar", "Regalos & Celebraciones", "Impuestos & Tasas",
    "Pago de Deudas & Préstamos", "Imprevistos & Emergencias", "Inversiones", "Ahorro Programado", "Otros Gastos",
]
DEFAULT_INCOME = [
    "Salario / Nómina Principal", "Horas Extras & Guardias", "Bonificaciones & Comisiones", "Servicios Freelance",
    "Consultoría & Asesoría", "Negocio Propio / Ventas", "Dividendos & Acciones", "Rentas / Alquileres de Inmuebles",
    "Rendimientos & Intereses Bancarios", "Reembolsos & Devoluciones", "Venta de Artículos de Segunda Mano",
    "Premios & Sorteos", "Regalos & Ayudas Familiares", "Criptomonedas & Staking", "Otros Ingresos",
]
# Categorías con lógica propia: la app las busca por clave, así siguen funcionando aunque se renombren
SYSTEM_DEFAULTS: Dict[str, str] = {
    "tax": "Impuestos & Tasas",
    "debt": "Pago de Deudas & Préstamos",
    "savings": "Ahorro Programado",
    "investments": "Inversiones",
    "card_income": "Rendimientos & Intereses Bancarios",
    "other_expense": "Otros Gastos",
    "other_income": "Otros Ingresos",
}
SYSTEM_KEY_BY_NAME = {name: key for key, name in SYSTEM_DEFAULTS.items()}
OTHER_KEY = {"expense": "other_expense", "income": "other_income"}


def _used_names(db: Session, user_id: str, kind: str) -> Set[str]:
    """Nombres ya usados en transacciones, presupuestos y recurrentes de ese tipo."""
    cols = [Expense.category, Budget.category] if kind == "expense" else [Income.category]
    names = {row[0] for col in cols for row in db.query(col).filter(col.class_.user_id == user_id).distinct()}
    names |= {row[0] for row in db.query(RecurringTransaction.category)
              .filter(RecurringTransaction.user_id == user_id, RecurringTransaction.kind == kind).distinct()}
    return {n.strip() for n in names if n and n.strip()}


def ensure_categories(db: Session, user_id: str) -> List[Category]:
    """Categorías del usuario; la primera vez copia las predefinidas más las que ya venía usando."""
    rows = db.query(Category).filter(Category.user_id == user_id).order_by(Category.kind, Category.position).all()
    if rows:
        return rows
    for kind, defaults in (("expense", DEFAULT_EXPENSE), ("income", DEFAULT_INCOME)):
        known = {d.lower() for d in defaults}
        extras = sorted(n for n in _used_names(db, user_id, kind) if n.lower() not in known)
        for position, name in enumerate(defaults + extras):
            db.add(Category(user_id=user_id, kind=kind, name=name, position=position,
                            system_key=SYSTEM_KEY_BY_NAME.get(name) if name in defaults else None))
    db.flush()
    return db.query(Category).filter(Category.user_id == user_id).order_by(Category.kind, Category.position).all()


def category_name(db: Session, user_id: str, key: str) -> str:
    """Nombre actual de una categoría del sistema (el predefinido si el usuario no la ha personalizado)."""
    row = db.query(Category.name).filter(Category.user_id == user_id, Category.system_key == key).first()
    return row[0] if row else SYSTEM_DEFAULTS[key]


def same_name(a: Optional[str], b: Optional[str]) -> bool:
    return (a or "").strip().lower() == (b or "").strip().lower()


def ensure_unique(db: Session, user_id: str, kind: str, name: str, exclude_id: Optional[str] = None) -> None:
    query = db.query(Category).filter(Category.user_id == user_id, Category.kind == kind,
                                      func.lower(Category.name) == name.strip().lower())
    if exclude_id:
        query = query.filter(Category.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Ya tienes una categoría llamada '{name.strip()}'.")


def _tables(kind: str):
    """(modelo, filtro extra) de cada tabla que guarda el nombre de una categoría de ese tipo."""
    if kind == "expense":
        return [(Expense, None), (Budget, None), (RecurringTransaction, RecurringTransaction.kind == "expense")]
    return [(Income, None), (RecurringTransaction, RecurringTransaction.kind == "income")]


def replace_category(db: Session, user_id: str, kind: str, old: str, new: str) -> None:
    """Cambia `old` por `new` en todas las tablas. Si ambos tienen presupuesto, se suman en uno solo."""
    if kind == "expense":
        old_budget = db.query(Budget).filter(Budget.user_id == user_id, func.lower(Budget.category) == old.lower()).first()
        new_budget = db.query(Budget).filter(Budget.user_id == user_id, func.lower(Budget.category) == new.lower()).first()
        if old_budget and new_budget and old_budget.id != new_budget.id:
            new_budget.allocated_amount = new_budget.allocated_amount + old_budget.allocated_amount
            db.delete(old_budget)
            db.flush()
    for model, extra in _tables(kind):
        query = db.query(model).filter(model.user_id == user_id, func.lower(model.category) == old.lower())
        if extra is not None:
            query = query.filter(extra)
        query.update({model.category: new}, synchronize_session=False)
