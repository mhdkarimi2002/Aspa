from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class MediaAsset(TimestampMixin, Base):
    __tablename__ = "media_assets"
    __table_args__ = (
        CheckConstraint(
            "review_status IN ('pending', 'approved', 'rejected')", name="ck_media_review"
        ),
        CheckConstraint(
            "rights_status IN ('unknown', 'owned', 'licensed', 'public_domain')",
            name="ck_media_rights",
        ),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    object_key: Mapped[str] = mapped_column(String(500), unique=True)
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    review_status: Mapped[str] = mapped_column(String(20), default="pending")
    rights_status: Mapped[str] = mapped_column(String(20), default="unknown")
    rights_reference: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    uploaded_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
