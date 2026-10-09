"""Add profile display name, biography and link."""

import sqlalchemy as sa
from alembic import op

revision = "20261009_0016"
down_revision = "20261009_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for name, length in [("name", 100), ("bio", 500), ("profile_link", 500)]:
        op.add_column("users", sa.Column(name, sa.String(length), nullable=True))


def downgrade() -> None:
    for name in ["profile_link", "bio", "name"]:
        op.drop_column("users", name)
