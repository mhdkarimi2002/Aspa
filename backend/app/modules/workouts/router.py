from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.exceptions import AppError
from app.db.session import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.workouts.schemas import StartWorkoutRequest, SyncWorkoutRequest, WorkoutRunResponse
from app.modules.workouts.service import WorkoutService
from app.modules.workouts.statistics import WorkoutBucket, WorkoutStatistics, calendar, statistics

router = APIRouter(prefix="/workouts", tags=["workouts"])


def get_service(session: DbSession, user: CurrentUser) -> WorkoutService:
    return WorkoutService(session, user.id)


Service = Annotated[WorkoutService, Depends(get_service)]


@router.post("", response_model=WorkoutRunResponse, status_code=status.HTTP_201_CREATED)
async def start(data: StartWorkoutRequest, service: Service) -> WorkoutRunResponse:
    return WorkoutRunResponse.model_validate(await service.start(data))


@router.put("/sync", response_model=WorkoutRunResponse)
async def sync(data: SyncWorkoutRequest, service: Service) -> WorkoutRunResponse:
    """Atomically replace a workout document; retries are deduplicated by mutation_id."""
    return WorkoutRunResponse.model_validate(await service.sync(data))


@router.get("", response_model=list[WorkoutRunResponse])
async def history(
    service: Service,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    completed_date: date | None = None,
) -> list[WorkoutRunResponse]:
    return [
        WorkoutRunResponse.model_validate(run)
        for run in await service.history(limit, offset, completed_date=completed_date)
    ]


@router.get("/exercises/{exercise_id}/history", response_model=list[WorkoutRunResponse])
async def exercise_history(
    exercise_id: UUID,
    service: Service,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[WorkoutRunResponse]:
    return [
        WorkoutRunResponse.model_validate(run)
        for run in await service.history(limit, offset, exercise_id)
    ]


@router.get("/active", response_model=WorkoutRunResponse)
async def active(service: Service) -> WorkoutRunResponse:
    return WorkoutRunResponse.model_validate(await service.active())


@router.get("/statistics", response_model=WorkoutStatistics)
async def workout_statistics(
    session: DbSession,
    user: CurrentUser,
    weeks: int = Query(13, ge=1, le=52),
    week_start: int = Query(0, ge=0, le=6),
    all_time: bool = False,
) -> WorkoutStatistics:
    return await statistics(session, user.id, weeks, week_start, all_time=all_time)


@router.get("/calendar", response_model=list[WorkoutBucket])
async def workout_calendar(
    session: DbSession,
    user: CurrentUser,
    month: date,
) -> list[WorkoutBucket]:
    if not 1900 <= month.year <= 2100:
        raise AppError("Calendar year must be between 1900 and 2100", status_code=422)
    return await calendar(session, user.id, month)


@router.get("/{run_id}", response_model=WorkoutRunResponse)
async def detail(run_id: UUID, service: Service) -> WorkoutRunResponse:
    return WorkoutRunResponse.model_validate(await service.owned(run_id))


@router.post("/{run_id}/complete", response_model=WorkoutRunResponse)
async def complete(run_id: UUID, service: Service) -> WorkoutRunResponse:
    return WorkoutRunResponse.model_validate(await service.finish(run_id, False))


@router.post("/{run_id}/cancel", response_model=WorkoutRunResponse)
async def cancel(run_id: UUID, service: Service) -> WorkoutRunResponse:
    return WorkoutRunResponse.model_validate(await service.finish(run_id, True))
