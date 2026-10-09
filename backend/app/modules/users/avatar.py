import base64
import binascii
from io import BytesIO
from uuid import UUID, uuid4

from fastapi import APIRouter, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field
from sqlalchemy import String, delete
from starlette.concurrency import run_in_threadpool

from app.core.exceptions import AppError
from app.db.session import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.users.models import UserAvatar

router = APIRouter()
PREFIX = "/api/users/avatars/"


class AvatarUpload(BaseModel):
    image: str = Field(min_length=1, max_length=7_000_000)


class AvatarResponse(BaseModel):
    avatar: str


def normalize_image(encoded: str) -> bytes:
    try:
        data = base64.b64decode(encoded, validate=True)
        if len(data) > 5 * 1024 * 1024:
            raise AppError("Photo must be smaller than 5 MB", status_code=413)
        with Image.open(BytesIO(data)) as image:
            if image.width * image.height > 20_000_000:
                raise AppError("Photo dimensions are too large", status_code=413)
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise AppError("Select a JPEG, PNG or WebP photo", status_code=422)
            image.load()
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            normalized = ImageOps.fit(normalized, (512, 512))
            output = BytesIO()
            normalized.save(output, format="JPEG", quality=85)
            return output.getvalue()
    except (
        binascii.Error,
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:
        raise AppError("Invalid photo", status_code=422) from exc


@router.post("/me/avatar", response_model=AvatarResponse)
async def upload_avatar(
    data: AvatarUpload, user: CurrentUser, session: DbSession
) -> AvatarResponse:
    normalized = await run_in_threadpool(normalize_image, data.image)
    identifier = uuid4()
    # Keep the saved photo and this draft; replacing a draft never removes the saved photo.
    await session.execute(
        delete(UserAvatar).where(
            UserAvatar.user_id == user.id,
            (PREFIX + UserAvatar.id.cast(String)) != (user.avatar or ""),
        )
    )
    session.add(UserAvatar(id=identifier, user_id=user.id, data=normalized))
    await session.commit()
    return AvatarResponse(avatar=PREFIX + str(identifier))


@router.get("/avatars/{identifier}")
async def get_avatar(identifier: UUID, session: DbSession) -> Response:
    photo = await session.get(UserAvatar, identifier)
    if photo is None:
        raise AppError("Photo not found", status_code=404)
    return Response(
        photo.data,
        media_type="image/jpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "X-Content-Type-Options": "nosniff",
        },
    )
