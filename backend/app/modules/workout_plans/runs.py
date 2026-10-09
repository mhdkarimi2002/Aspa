"""Compatibility exports; workout tracking lives in the workouts module."""

from app.modules.workouts.router import router as router
from app.modules.workouts.schemas import StartWorkoutRequest as StartWorkoutRequest
from app.modules.workouts.schemas import WorkoutRunResponse as WorkoutRunResponse
