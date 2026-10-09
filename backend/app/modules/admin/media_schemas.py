from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class MediaReview(BaseModel):
    review_status: Literal["pending", "approved", "rejected"]
    rights_status: Literal["unknown", "owned", "licensed", "public_domain"]
    rights_reference: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def approved_rights(self) -> MediaReview:
        if self.review_status == "approved" and (
            self.rights_status == "unknown"
            or not self.rights_reference
            or not self.rights_reference.strip()
        ):
            raise ValueError("Approval requires documented usage rights")
        return self


class MediaResponse(MediaReview):
    id: UUID
    object_key: str
    content_type: str
    size_bytes: int
    preview_url: str | None = None
