from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile

from app.db.session import DbSession
from app.modules.admin.media_schemas import MediaResponse, MediaReview
from app.modules.admin.media_service import MediaService
from app.modules.auth.dependencies import CurrentAdmin

router = APIRouter(prefix="/admin/media", tags=["admin media"])


def get_service(session: DbSession, admin: CurrentAdmin) -> MediaService:
    return MediaService(session, admin.id)


Service = Annotated[MediaService, Depends(get_service)]


@router.get("", response_model=list[MediaResponse])
async def list_media(
    service: Service, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)
) -> list[MediaResponse]:
    return await service.list(limit, offset)


@router.post("", response_model=MediaResponse, status_code=201)
async def upload(file: UploadFile, service: Service) -> MediaResponse:
    return await service.upload(file)


@router.patch("/{asset_id}", response_model=MediaResponse)
async def review(asset_id: UUID, data: MediaReview, service: Service) -> MediaResponse:
    return await service.review(asset_id, data)
