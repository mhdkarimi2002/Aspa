from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.integrations.storage import media_url, upload_media
from app.modules.admin.media_models import MediaAsset
from app.modules.admin.media_schemas import MediaResponse, MediaReview
from app.modules.admin.models import AdminAuditLog


def asset_response(asset: MediaAsset, url: str | None = None) -> MediaResponse:
    return MediaResponse.model_validate(
        {
            "id": asset.id,
            "object_key": asset.object_key,
            "content_type": asset.content_type,
            "size_bytes": asset.size_bytes,
            "review_status": asset.review_status,
            "rights_status": asset.rights_status,
            "rights_reference": asset.rights_reference,
            "preview_url": url,
        }
    )


class MediaService:
    def __init__(self, session: AsyncSession, actor_id: UUID) -> None:
        self.session = session
        self.actor_id = actor_id

    async def list(self, limit: int, offset: int) -> list[MediaResponse]:
        assets = await self.session.scalars(
            select(MediaAsset)
            .order_by(MediaAsset.created_at.desc(), MediaAsset.id)
            .limit(limit)
            .offset(offset)
        )
        result: list[MediaResponse] = []
        for asset in assets:
            try:
                url = await media_url(asset.object_key)
            except AppError:
                url = None
            result.append(asset_response(asset, url))
        return result

    async def upload(self, file: UploadFile) -> MediaResponse:
        try:
            content = await file.read(get_settings().media_max_bytes + 1)
        finally:
            await file.close()
        key = await upload_media(content, file.content_type or "")
        asset = MediaAsset(
            object_key=key,
            content_type=file.content_type or "",
            size_bytes=len(content),
            review_status="pending",
            rights_status="unknown",
            uploaded_by=self.actor_id,
        )
        self.session.add(asset)
        await self.session.flush()
        self.session.add(
            AdminAuditLog(
                actor_user_id=self.actor_id,
                action="media.upload",
                target_type="media",
                target_id=asset.id,
            )
        )
        await self.session.commit()
        return asset_response(asset)

    async def review(self, asset_id: UUID, data: MediaReview) -> MediaResponse:
        asset = await self.session.get(MediaAsset, asset_id)
        if asset is None:
            raise AppError("Media not found", status_code=404)
        asset.review_status = data.review_status
        asset.rights_status = data.rights_status
        asset.rights_reference = data.rights_reference
        self.session.add(
            AdminAuditLog(
                actor_user_id=self.actor_id,
                action="media.review",
                target_type="media",
                target_id=asset.id,
            )
        )
        await self.session.commit()
        return asset_response(asset)
