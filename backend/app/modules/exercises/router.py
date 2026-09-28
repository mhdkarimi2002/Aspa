from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.modules.auth.dependencies import CurrentUser
from app.modules.exercises.dependencies import ExerciseServiceDep
from app.modules.exercises.models import ExerciseDifficulty
from app.modules.exercises.schemas import (
    CatalogReference,
    ExerciseCreate,
    ExercisePage,
    ExerciseResponse,
    ExerciseSort,
    MuscleGroupCreate,
    SortDirection,
)

router = APIRouter(tags=["exercises"])


@router.get("/exercises", response_model=ExercisePage)
async def list_exercises(
    service: ExerciseServiceDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(min_length=1, max_length=200)] = None,
    muscle_group_id: UUID | None = None,
    equipment_id: UUID | None = None,
    difficulty: ExerciseDifficulty | None = None,
    sort: ExerciseSort = ExerciseSort.NAME_FA,
    direction: SortDirection = SortDirection.ASC,
) -> ExercisePage:
    return await service.list_exercises(
        page=page,
        page_size=page_size,
        search=search,
        muscle_group_id=muscle_group_id,
        equipment_id=equipment_id,
        difficulty=difficulty,
        sort=sort,
        direction=direction,
    )


@router.post("/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    data: ExerciseCreate, _: CurrentUser, service: ExerciseServiceDep
) -> ExerciseResponse:
    return await service.create_exercise(data)


@router.get("/exercises/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(exercise_id: UUID, service: ExerciseServiceDep) -> ExerciseResponse:
    return await service.get_exercise(exercise_id)


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: UUID, _: CurrentUser, service: ExerciseServiceDep
) -> Response:
    await service.delete_exercise(exercise_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/muscle-groups", response_model=list[CatalogReference])
async def list_muscle_groups(service: ExerciseServiceDep) -> list[CatalogReference]:
    return await service.list_muscle_groups()


@router.post(
    "/muscle-groups",
    response_model=CatalogReference,
    status_code=status.HTTP_201_CREATED,
)
async def create_muscle_group(
    data: MuscleGroupCreate, _: CurrentUser, service: ExerciseServiceDep
) -> CatalogReference:
    return await service.create_muscle_group(data)


@router.delete("/muscle-groups/{muscle_group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_muscle_group(
    muscle_group_id: UUID, _: CurrentUser, service: ExerciseServiceDep
) -> Response:
    await service.delete_muscle_group(muscle_group_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/equipment", response_model=list[CatalogReference])
async def list_equipment(service: ExerciseServiceDep) -> list[CatalogReference]:
    return await service.list_equipment()
