"""Repeatable workout executions and their completion history."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import AppError
from app.db.session import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.workout_plans.models import WorkoutRun
from app.modules.workout_plans.repository import WorkoutPlanRepository

router = APIRouter(prefix="/workouts", tags=["workouts"])


class StartWorkoutRequest(BaseModel):
    plan_id: UUID
    client_id: UUID | None = None


class WorkoutRunResponse(BaseModel):
    id: UUID
    plan_id: UUID | None
    plan_name: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    duration_seconds: int | None


def _response(run: WorkoutRun) -> WorkoutRunResponse:
    return WorkoutRunResponse(
        id=run.id,
        plan_id=run.plan_id,
        plan_name=run.plan_name,
        status=run.status,
        started_at=run.started_at,
        completed_at=run.completed_at,
        duration_seconds=run.duration_seconds,
    )


async def _owned_run(session: DbSession, run_id: UUID, user_id: UUID) -> WorkoutRun:
    run = await session.scalar(
        select(WorkoutRun)
        .where(WorkoutRun.id == run_id, WorkoutRun.user_id == user_id)
        .execution_options(populate_existing=True)
    )
    if run is None:
        raise AppError("Workout not found", status_code=404, code="not_found")
    return run


@router.post("", response_model=WorkoutRunResponse, status_code=status.HTTP_201_CREATED)
async def start_workout(
    data: StartWorkoutRequest, current_user: CurrentUser, session: DbSession
) -> WorkoutRunResponse:
    if data.client_id is not None:
        existing = await session.scalar(
            select(WorkoutRun).where(
                WorkoutRun.user_id == current_user.id,
                WorkoutRun.client_id == data.client_id,
            )
        )
        if existing is not None:
            if existing.plan_id != data.plan_id:
                raise AppError("Client ID already belongs to another workout", status_code=409)
            return _response(existing)
    active = await session.scalar(
        select(WorkoutRun).where(
            WorkoutRun.user_id == current_user.id,
            WorkoutRun.status == "in_progress",
        )
    )
    if active is not None:
        raise AppError("Finish or cancel the current workout first", status_code=409)
    plan = await WorkoutPlanRepository(session).get_owned(data.plan_id, current_user.id)
    if plan is None:
        raise AppError("Workout plan not found", status_code=404, code="not_found")
    if plan.is_archived or not any(day.exercises for day in plan.days):
        raise AppError("This plan cannot be started", status_code=409)
    run = WorkoutRun(
        user_id=current_user.id,
        plan_id=plan.id,
        client_id=data.client_id,
        plan_name=plan.name,
        status="in_progress",
        started_at=datetime.now(UTC),
    )
    session.add(run)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise AppError("A workout is already in progress", status_code=409) from exc
    return _response(run)


@router.get("", response_model=list[WorkoutRunResponse])
async def list_workout_history(
    current_user: CurrentUser,
    session: DbSession,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[WorkoutRunResponse]:
    result = await session.scalars(
        select(WorkoutRun)
        .where(WorkoutRun.user_id == current_user.id, WorkoutRun.status == "completed")
        .order_by(WorkoutRun.completed_at.desc(), WorkoutRun.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return [_response(run) for run in result]


@router.get("/active", response_model=WorkoutRunResponse)
async def get_active_workout(current_user: CurrentUser, session: DbSession) -> WorkoutRunResponse:
    run = await session.scalar(
        select(WorkoutRun).where(
            WorkoutRun.user_id == current_user.id, WorkoutRun.status == "in_progress"
        )
    )
    if run is None:
        raise AppError("No active workout", status_code=404, code="not_found")
    return _response(run)


@router.get("/{run_id}", response_model=WorkoutRunResponse)
async def get_workout(
    run_id: UUID, current_user: CurrentUser, session: DbSession
) -> WorkoutRunResponse:
    return _response(await _owned_run(session, run_id, current_user.id))


@router.post("/{run_id}/complete", response_model=WorkoutRunResponse)
async def complete_workout(
    run_id: UUID, current_user: CurrentUser, session: DbSession
) -> WorkoutRunResponse:
    run = await _owned_run(session, run_id, current_user.id)
    if run.status == "completed":
        return _response(run)
    if run.status != "in_progress":
        raise AppError("Cancelled workouts cannot be completed", status_code=409)
    now = datetime.now(UTC)
    run.status = "completed"
    run.completed_at = now
    run.duration_seconds = max(0, int((now - run.started_at).total_seconds()))
    await session.commit()
    return _response(run)


@router.post("/{run_id}/cancel", response_model=WorkoutRunResponse)
async def cancel_workout(
    run_id: UUID, current_user: CurrentUser, session: DbSession
) -> WorkoutRunResponse:
    run = await _owned_run(session, run_id, current_user.id)
    if run.status == "completed":
        raise AppError("Completed workouts cannot be cancelled", status_code=409)
    if run.status == "in_progress":
        run.status = "cancelled"
        await session.commit()
    return _response(run)
