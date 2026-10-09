"""Add optional profile province."""

import sqlalchemy as sa
from alembic import op

revision = "20261009_0018"
down_revision = "20261009_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("province", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "province")
