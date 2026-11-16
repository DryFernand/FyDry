from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

from app.schemas.financial import ORMModel


def _clean(v: str) -> str:
    v = " ".join(str(v).split())
    if not v:
        raise ValueError("El nombre no puede estar vacío.")
    return v


class CategoryCreate(BaseModel):
    kind: Literal["expense", "income"]
    name: str = Field(..., max_length=100)

    _name = field_validator("name")(_clean)


class CategoryRename(BaseModel):
    name: str = Field(..., max_length=100)

    _name = field_validator("name")(_clean)


class CategoryResponse(ORMModel):
    id: str
    kind: str
    name: str
    system_key: Optional[str] = None
