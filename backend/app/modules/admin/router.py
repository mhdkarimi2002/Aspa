from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.db.session import DbSession
from app.modules.admin.schemas import (
    AdminCatalogCreate,
    AdminCatalogItem,
    AdminCatalogUpdate,
    AdminExercisePage,
    AdminExerciseResponse,
    AdminExerciseStatus,
    AdminExerciseUpdate,
    AdminUserPage,
    AdminUserUpdate,
)
from app.modules.admin.service import AdminService
from app.modules.auth.dependencies import CurrentAdmin
from app.modules.exercises.dependencies import ExerciseServiceDep
from app.modules.exercises.schemas import ExerciseCreate, ExerciseResponse
from app.modules.users.schemas import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_service(session: DbSession, admin: CurrentAdmin) -> AdminService:
    return AdminService(session, admin.id)


AdminServiceDep = Annotated[AdminService, Depends(get_admin_service)]


@router.get("/me", response_model=UserResponse)
async def get_admin_me(admin: CurrentAdmin) -> UserResponse:
    return UserResponse.model_validate(admin)


@router.get("/users", response_model=AdminUserPage)
async def list_users(
    _: CurrentAdmin,
    service: AdminServiceDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=100)] = None,
    is_active: bool | None = None,
) -> AdminUserPage:
    return await service.list_users(
        page=page, page_size=page_size, search=search, is_active=is_active
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, _: CurrentAdmin, service: AdminServiceDep) -> UserResponse:
    return await service.get_user(user_id)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID, data: AdminUserUpdate, admin: CurrentAdmin, service: AdminServiceDep
) -> UserResponse:
    return await service.update_user(user_id, admin.id, data)


@router.get("/exercises", response_model=AdminExercisePage)
async def list_exercises(
    _: CurrentAdmin,
    service: AdminServiceDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=200)] = None,
    is_active: bool | None = None,
) -> AdminExercisePage:
    return await service.list_exercises(
        page=page, page_size=page_size, search=search, is_active=is_active
    )


@router.post("/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    data: ExerciseCreate, admin: CurrentAdmin, service: ExerciseServiceDep
) -> ExerciseResponse:
    return await service.create_exercise(data, admin.id)


@router.get("/exercises/{exercise_id}", response_model=AdminExerciseResponse)
async def get_exercise(
    exercise_id: UUID, _: CurrentAdmin, service: AdminServiceDep
) -> AdminExerciseResponse:
    return await service.get_exercise(exercise_id)


@router.put("/exercises/{exercise_id}", response_model=AdminExerciseResponse)
async def update_exercise(
    exercise_id: UUID,
    data: AdminExerciseUpdate,
    _: CurrentAdmin,
    service: AdminServiceDep,
) -> AdminExerciseResponse:
    return await service.update_exercise(exercise_id, data)


@router.patch("/exercises/{exercise_id}/status", response_model=AdminExerciseResponse)
async def set_exercise_status(
    exercise_id: UUID,
    data: AdminExerciseStatus,
    _: CurrentAdmin,
    service: AdminServiceDep,
) -> AdminExerciseResponse:
    return await service.set_exercise_status(exercise_id, data)


CatalogKind = Literal["muscle-groups", "equipment"]


@router.get("/catalog/{kind}", response_model=list[AdminCatalogItem])
async def list_catalog(
    kind: CatalogKind, _: CurrentAdmin, service: AdminServiceDep
) -> list[AdminCatalogItem]:
    return await service.list_catalog(kind)


@router.post(
    "/catalog/{kind}", response_model=AdminCatalogItem, status_code=status.HTTP_201_CREATED
)
async def create_catalog(
    kind: CatalogKind,
    data: AdminCatalogCreate,
    _: CurrentAdmin,
    service: AdminServiceDep,
) -> AdminCatalogItem:
    return await service.create_catalog(kind, data)


@router.patch("/catalog/{kind}/{item_id}", response_model=AdminCatalogItem)
async def update_catalog(
    kind: CatalogKind,
    item_id: UUID,
    data: AdminCatalogUpdate,
    _: CurrentAdmin,
    service: AdminServiceDep,
) -> AdminCatalogItem:
    return await service.update_catalog(kind, item_id, data)
