from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.modules.exercises.schemas import CatalogName, ExerciseCreate, ExerciseResponse
from app.modules.users.models import AccountLevel
from app.modules.users.schemas import UserResponse


class AdminUserPage(BaseModel):
    items: list[UserResponse]
    page: int
    page_size: int
    total: int
    pages: int


class AdminUserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_active: bool | None = None
    account_level: AccountLevel | None = None


class AdminExerciseResponse(ExerciseResponse):
    is_active: bool


class AdminExercisePage(BaseModel):
    items: list[AdminExerciseResponse]
    page: int
    page_size: int
    total: int
    pages: int


class AdminExerciseUpdate(ExerciseCreate):
    is_active: bool = True


class AdminCatalogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name_fa: str
    is_active: bool


class AdminCatalogCreate(BaseModel):
    name_fa: CatalogName


class AdminCatalogUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name_fa: CatalogName | None = None
    is_active: bool | None = None


class AdminExerciseStatus(BaseModel):
    is_active: bool
