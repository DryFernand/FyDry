from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRename, CategoryResponse
from app.services.categories import OTHER_KEY, ensure_categories, ensure_unique, replace_category

router = APIRouter()


def _get(db: Session, user_id: str, category_id: str) -> Category:
    ensure_categories(db, user_id)
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    return cat


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = ensure_categories(db, current_user.id)
    db.commit()
    return rows


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_categories(db, current_user.id)
    ensure_unique(db, current_user.id, cat_in.kind, cat_in.name)
    last = db.query(func.max(Category.position)).filter(
        Category.user_id == current_user.id, Category.kind == cat_in.kind
    ).scalar()
    cat = Category(user_id=current_user.id, kind=cat_in.kind, name=cat_in.name, position=(last or 0) + 1)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def rename_category(category_id: str, cat_in: CategoryRename, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    """Renombra y actualiza el nombre en gastos, ingresos, presupuestos y recurrentes."""
    cat = _get(db, current_user.id, category_id)
    if cat_in.name != cat.name:
        ensure_unique(db, current_user.id, cat.kind, cat_in.name, exclude_id=cat.id)
        replace_category(db, current_user.id, cat.kind, cat.name, cat_in.name)
        cat.name = cat_in.name
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}")
def delete_category(category_id: str, move_to: Optional[str] = Query(None, max_length=36),
                    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Elimina la categoría y mueve sus transacciones, presupuesto y recurrentes a `move_to` (por defecto "Otros")."""
    cat = _get(db, current_user.id, category_id)
    if cat.system_key:
        raise HTTPException(status_code=400, detail=f"'{cat.name}' es una categoría del sistema: puedes renombrarla, pero no eliminarla.")
    if move_to:
        target = _get(db, current_user.id, move_to)
    else:
        target = db.query(Category).filter(
            Category.user_id == current_user.id, Category.system_key == OTHER_KEY[cat.kind]
        ).first()
    if not target or target.id == cat.id or target.kind != cat.kind:
        raise HTTPException(status_code=400, detail="Elige otra categoría del mismo tipo para mover sus movimientos.")
    replace_category(db, current_user.id, cat.kind, cat.name, target.name)
    db.delete(cat)
    db.commit()
    return {"status": "success", "moved_to": target.name}
