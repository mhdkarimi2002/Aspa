"""Idempotent development data for local API and frontend work."""

import asyncio
from dataclasses import dataclass
from datetime import date
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import engine, session_factory
from app.modules.exercises.models import (
    Equipment,
    Exercise,
    ExerciseDifficulty,
    ExerciseMuscle,
    MuscleGroup,
)
from app.modules.users.models import AccountLevel, Gender, User
from app.modules.workout_plans.models import (
    WorkoutPlan,
    WorkoutPlanDay,
    WorkoutPlanExercise,
    WorkoutPlanSet,
)

SEED_PHONE_NUMBER = "+989120000000"


def seed_id(kind: str, name: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"https://aspa.local/seed/{kind}/{name}")


@dataclass(frozen=True)
class CatalogItem:
    key: str
    name_fa: str


@dataclass(frozen=True)
class ExerciseItem:
    slug: str
    name_fa: str
    description_fa: str
    difficulty: ExerciseDifficulty
    equipment: str | None
    primary_muscles: tuple[str, ...]
    secondary_muscles: tuple[str, ...] = ()


MUSCLE_GROUPS = (
    CatalogItem("Chest", "سینه"),
    CatalogItem("Back", "پشت"),
    CatalogItem("Shoulders", "سرشانه"),
    CatalogItem("Biceps", "جلو بازو"),
    CatalogItem("Triceps", "پشت بازو"),
    CatalogItem("Quadriceps", "چهارسر ران"),
    CatalogItem("Hamstrings", "همسترینگ"),
    CatalogItem("Glutes", "سرینی"),
    CatalogItem("Core", "عضلات مرکزی"),
    CatalogItem("Full Body", "تمام بدن"),
)

EQUIPMENT = (
    CatalogItem("Bodyweight", "وزن بدن"),
    CatalogItem("Dumbbells", "دمبل"),
    CatalogItem("Barbell", "هالتر"),
    CatalogItem("Exercise Mat", "مت ورزشی"),
)

EXERCISES = (
    ExerciseItem(
        "push-up",
        "شنا سوئدی",
        "یک حرکت پایه برای تقویت عضلات بالاتنه.",
        ExerciseDifficulty.BEGINNER,
        "Bodyweight",
        ("Chest",),
        ("Triceps", "Shoulders"),
    ),
    ExerciseItem(
        "bodyweight-squat",
        "اسکوات با وزن بدن",
        "حرکت اسکوات مناسب مبتدیان برای تقویت پایین‌تنه.",
        ExerciseDifficulty.BEGINNER,
        "Bodyweight",
        ("Quadriceps", "Glutes"),
        ("Hamstrings",),
    ),
    ExerciseItem(
        "plank",
        "پلانک",
        "حرکت ایستا برای افزایش ثبات عضلات مرکزی.",
        ExerciseDifficulty.BEGINNER,
        "Exercise Mat",
        ("Core",),
        ("Shoulders",),
    ),
    ExerciseItem(
        "dumbbell-row",
        "زیربغل دمبل تک‌دست",
        "حرکت کششی تک‌دست برای تقویت عضلات پشت.",
        ExerciseDifficulty.INTERMEDIATE,
        "Dumbbells",
        ("Back",),
        ("Biceps",),
    ),
    ExerciseItem(
        "dumbbell-shoulder-press",
        "پرس سرشانه دمبل",
        "پرس بالای سر برای تقویت عضلات سرشانه.",
        ExerciseDifficulty.INTERMEDIATE,
        "Dumbbells",
        ("Shoulders",),
        ("Triceps",),
    ),
    ExerciseItem(
        "romanian-deadlift",
        "ددلیفت رومانیایی",
        "حرکت خم‌شدن از لگن با تمرکز بر زنجیره خلفی بدن.",
        ExerciseDifficulty.INTERMEDIATE,
        "Barbell",
        ("Hamstrings", "Glutes"),
        ("Back",),
    ),
    ExerciseItem(
        "barbell-bench-press",
        "پرس سینه هالتر",
        "حرکت ترکیبی پرس برای افزایش قدرت بالاتنه.",
        ExerciseDifficulty.INTERMEDIATE,
        "Barbell",
        ("Chest",),
        ("Triceps", "Shoulders"),
    ),
    ExerciseItem(
        "burpee",
        "برپی",
        "حرکت هوازی پویا با درگیری تمام بدن.",
        ExerciseDifficulty.ADVANCED,
        "Bodyweight",
        ("Full Body",),
        ("Core",),
    ),
)


async def _seed_user(session: AsyncSession) -> User:
    user = await session.scalar(select(User).where(User.phone_number == SEED_PHONE_NUMBER))
    if user is None:
        user = User(id=seed_id("user", SEED_PHONE_NUMBER), phone_number=SEED_PHONE_NUMBER)
        session.add(user)
    user.username = "aspa_developer"
    user.email = "developer@example.com"
    user.birthdate = date(1995, 1, 15)
    user.gender = Gender.PREFER_NOT_TO_SAY
    user.account_level = AccountLevel.FREE
    user.is_active = True
    user.is_admin = get_settings().environment == "local"
    await session.flush()
    return user


async def _seed_muscle_groups(session: AsyncSession) -> dict[str, MuscleGroup]:
    result: dict[str, MuscleGroup] = {}
    for item in MUSCLE_GROUPS:
        model = await session.scalar(select(MuscleGroup).where(MuscleGroup.name_fa == item.name_fa))
        if model is None:
            model = MuscleGroup(id=seed_id("muscle-group", item.key))
            session.add(model)
        model.name_fa = item.name_fa
        model.is_active = True
        result[item.key] = model
    await session.flush()
    return result


async def _seed_equipment(session: AsyncSession) -> dict[str, Equipment]:
    result: dict[str, Equipment] = {}
    for item in EQUIPMENT:
        model = await session.scalar(select(Equipment).where(Equipment.name_fa == item.name_fa))
        if model is None:
            model = Equipment(id=seed_id("equipment", item.key))
            session.add(model)
        model.name_fa = item.name_fa
        model.is_active = True
        result[item.key] = model
    await session.flush()
    return result


async def _seed_exercises(
    session: AsyncSession,
    muscle_groups: dict[str, MuscleGroup],
    equipment: dict[str, Equipment],
) -> dict[str, Exercise]:
    result: dict[str, Exercise] = {}
    for item in EXERCISES:
        identifier = seed_id("exercise", item.slug)
        exercise = await session.scalar(
            select(Exercise).where(or_(Exercise.id == identifier, Exercise.name_fa == item.name_fa))
        )
        if exercise is None:
            exercise = Exercise(id=identifier)
            session.add(exercise)
        exercise.name_fa = item.name_fa
        exercise.description_fa = item.description_fa
        exercise.difficulty = item.difficulty
        exercise.equipment_id = equipment[item.equipment].id if item.equipment else None
        exercise.is_active = True
        await session.flush()

        desired = {
            muscle_groups[name].id: is_primary
            for names, is_primary in (
                (item.primary_muscles, True),
                (item.secondary_muscles, False),
            )
            for name in names
        }
        current_links = await session.scalars(
            select(ExerciseMuscle).where(ExerciseMuscle.exercise_id == exercise.id)
        )
        current = {link.muscle_group_id: link for link in current_links}
        for muscle_id, is_primary in desired.items():
            link = current.get(muscle_id)
            if link is None:
                session.add(
                    ExerciseMuscle(
                        exercise_id=exercise.id, muscle_group_id=muscle_id, is_primary=is_primary
                    )
                )
            else:
                link.is_primary = is_primary
        for muscle_id, link in current.items():
            if muscle_id not in desired:
                await session.delete(link)
        result[item.slug] = exercise
    await session.flush()
    return result


async def _add_plan_if_missing(
    session: AsyncSession,
    user: User,
    exercises: dict[str, Exercise],
    *,
    slug: str,
    name: str,
    description: str,
    is_archived: bool,
    is_active: bool = False,
    days: tuple[tuple[str, tuple[tuple[str, int, int, int, int, str | None], ...]], ...],
) -> None:
    identifier = seed_id("workout-plan", slug)
    existing = await session.scalar(
        select(WorkoutPlan).where(
            WorkoutPlan.user_id == user.id,
            or_(WorkoutPlan.id == identifier, WorkoutPlan.name == name),
        )
    )
    if existing is not None:
        if existing.id == identifier:
            existing.name = name
            existing.description = description
        if is_active and not existing.is_archived and not existing.is_active:
            active_plan_id = await session.scalar(
                select(WorkoutPlan.id).where(
                    WorkoutPlan.user_id == user.id,
                    WorkoutPlan.is_active.is_(True),
                )
            )
            if active_plan_id is None:
                existing.is_active = True
        return

    plan_exercises = [
        WorkoutPlanExercise(
            id=seed_id("workout-plan-exercise", f"{slug}/{position}"),
            exercise_id=exercises[exercise_slug].id,
            position=position,
            sets=sets,
            min_reps=min_reps,
            max_reps=max_reps,
            rest_seconds=rest_seconds,
            notes=notes,
            target_sets=[
                WorkoutPlanSet(position=set_position, target_reps=min_reps)
                for set_position in range(sets)
            ],
        )
        for position, (
            exercise_slug,
            sets,
            min_reps,
            max_reps,
            rest_seconds,
            notes,
        ) in enumerate(item for _, items in days for item in items)
    ]
    plan_days = [
        WorkoutPlanDay(
            id=seed_id("workout-plan-day", f"{slug}/0"),
            name="تمرین",
            position=0,
            exercises=plan_exercises,
        )
    ]
    session.add(
        WorkoutPlan(
            id=identifier,
            user_id=user.id,
            name=name,
            description=description,
            is_archived=is_archived,
            is_active=is_active,
            days=plan_days,
        )
    )


async def seed_database(session: AsyncSession) -> None:
    user = await _seed_user(session)
    muscle_groups = await _seed_muscle_groups(session)
    equipment = await _seed_equipment(session)
    exercises = await _seed_exercises(session, muscle_groups, equipment)

    await _add_plan_if_missing(
        session,
        user,
        exercises,
        slug="three-day-full-body",
        name="برنامه تمام بدن",
        description="برنامه نمونه برای توسعه و آزمایش رابط کاربری",
        is_archived=False,
        is_active=True,
        days=(
            (
                "روز اول - قدرت پایه",
                (
                    ("bodyweight-squat", 3, 10, 12, 90, None),
                    ("push-up", 3, 8, 12, 75, "فرم صحیح را حفظ کنید"),
                    ("dumbbell-row", 3, 10, 12, 90, None),
                    ("plank", 3, 30, 45, 60, "تکرارها بر حسب ثانیه"),
                ),
            ),
            (
                "روز دوم - زنجیره خلفی",
                (
                    ("romanian-deadlift", 4, 8, 10, 120, None),
                    ("dumbbell-shoulder-press", 3, 8, 12, 90, None),
                    ("plank", 3, 30, 60, 60, "تکرارها بر حسب ثانیه"),
                ),
            ),
            (
                "روز سوم - بالاتنه",
                (
                    ("barbell-bench-press", 4, 6, 10, 120, None),
                    ("dumbbell-row", 4, 8, 12, 90, None),
                    ("burpee", 3, 8, 12, 90, "با سرعت کنترل‌شده"),
                ),
            ),
        ),
    )
    await _add_plan_if_missing(
        session,
        user,
        exercises,
        slug="starter-archived",
        name="برنامه شروع سریع",
        description="یک برنامه آرشیوشده برای آزمایش وضعیت‌های رابط کاربری",
        is_archived=True,
        days=(
            (
                "تمرین مقدماتی",
                (
                    ("bodyweight-squat", 2, 10, 12, 60, None),
                    ("push-up", 2, 6, 10, 60, None),
                    ("plank", 2, 20, 30, 45, "تکرارها بر حسب ثانیه"),
                ),
            ),
        ),
    )
    await session.commit()


async def _main() -> None:
    if get_settings().environment != "local":
        raise RuntimeError("Development seed is available only in the local environment")
    try:
        async with session_factory() as session:
            await seed_database(session)
    finally:
        await engine.dispose()
    print("Development data seeded successfully.")
    print(f"Login phone number: {SEED_PHONE_NUMBER}")


if __name__ == "__main__":
    asyncio.run(_main())
