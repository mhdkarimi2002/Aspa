"""Remove English localization columns from the exercise domain."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260929_0008"
down_revision: str | None = "20260929_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("muscle_groups_name_en_key", "muscle_groups", type_="unique")
    op.drop_column("muscle_groups", "name_en")
    op.drop_constraint("equipment_name_en_key", "equipment", type_="unique")
    op.drop_column("equipment", "name_en")

    op.drop_index(op.f("ix_exercises_name_en"), table_name="exercises")
    op.drop_column("exercises", "description_en")
    op.drop_column("exercises", "name_en")

    op.execute("DELETE FROM exercise_instruction_steps WHERE text_fa IS NULL")
    op.drop_constraint(
        "ck_exercise_instruction_steps_has_text",
        "exercise_instruction_steps",
        type_="check",
    )
    op.alter_column(
        "exercise_instruction_steps",
        "text_fa",
        existing_type=sa.Text(),
        nullable=False,
    )
    op.drop_column("exercise_instruction_steps", "text_en")


def downgrade() -> None:
    op.add_column(
        "exercise_instruction_steps",
        sa.Column("text_en", sa.Text(), nullable=True),
    )
    op.alter_column(
        "exercise_instruction_steps",
        "text_fa",
        existing_type=sa.Text(),
        nullable=True,
    )
    op.create_check_constraint(
        "ck_exercise_instruction_steps_has_text",
        "exercise_instruction_steps",
        "text_fa IS NOT NULL OR text_en IS NOT NULL",
    )

    op.add_column("exercises", sa.Column("name_en", sa.String(200), nullable=True))
    op.add_column("exercises", sa.Column("description_en", sa.Text(), nullable=True))
    op.create_index(op.f("ix_exercises_name_en"), "exercises", ["name_en"])

    op.add_column("equipment", sa.Column("name_en", sa.String(100), nullable=True))
    op.execute("UPDATE equipment SET name_en = name_fa")
    op.alter_column("equipment", "name_en", existing_type=sa.String(100), nullable=False)
    op.create_unique_constraint("equipment_name_en_key", "equipment", ["name_en"])

    op.add_column("muscle_groups", sa.Column("name_en", sa.String(100), nullable=True))
    op.execute("UPDATE muscle_groups SET name_en = name_fa")
    op.alter_column("muscle_groups", "name_en", existing_type=sa.String(100), nullable=False)
    op.create_unique_constraint("muscle_groups_name_en_key", "muscle_groups", ["name_en"])
