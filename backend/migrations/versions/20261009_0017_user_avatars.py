"""Store normalized profile photos with their owner."""

import sqlalchemy as sa
from alembic import op

revision = "20261009_0017"
down_revision = "20261009_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_avatars",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("data", sa.LargeBinary(), nullable=False),
    )
    op.create_index("ix_user_avatars_user_id", "user_avatars", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_avatars")
