"""Expand user profiles and remove password authentication."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260927_0005"
down_revision: str | None = "20260924_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("birthdate", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(length=20), nullable=True))
    op.add_column(
        "users",
        sa.Column("account_level", sa.String(length=10), server_default="free", nullable=False),
    )
    op.add_column("users", sa.Column("avatar", sa.String(length=500), nullable=True))
    op.create_check_constraint(
        "ck_users_gender",
        "users",
        "gender IN ('male', 'female', 'other', 'prefer_not_to_say')",
    )
    op.create_check_constraint(
        "ck_users_account_level", "users", "account_level IN ('free', 'pro')"
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.drop_column("users", "hashed_password")


def downgrade() -> None:
    op.add_column("users", sa.Column("hashed_password", sa.String(length=255), nullable=True))
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_constraint("ck_users_account_level", "users", type_="check")
    op.drop_constraint("ck_users_gender", "users", type_="check")
    op.drop_column("users", "avatar")
    op.drop_column("users", "account_level")
    op.drop_column("users", "gender")
    op.drop_column("users", "birthdate")
    op.drop_column("users", "username")
