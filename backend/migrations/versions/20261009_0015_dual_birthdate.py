"""Store Gregorian and Jalali birthdates together."""

import sqlalchemy as sa
from alembic import op

from app.core.calendars import to_jalali

revision = "20261009_0015"
down_revision = "20261009_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("birthdate_jalali", sa.String(10), nullable=True))
    bind = op.get_bind()
    users = sa.table(
        "users",
        sa.column("id", sa.Uuid()),
        sa.column("birthdate", sa.Date()),
        sa.column("birthdate_jalali", sa.String()),
    )
    for row in bind.execute(
        sa.select(users.c.id, users.c.birthdate).where(users.c.birthdate.is_not(None))
    ):
        op.execute(
            users.update()
            .where(users.c.id == row.id)
            .values(birthdate_jalali=to_jalali(row.birthdate))
        )
    op.create_check_constraint(
        "ck_users_birthdate_pair", "users", "(birthdate IS NULL) = (birthdate_jalali IS NULL)"
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_birthdate_pair", "users", type_="check")
    op.drop_column("users", "birthdate_jalali")
