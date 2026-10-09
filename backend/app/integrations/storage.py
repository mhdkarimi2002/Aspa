"""S3-compatible storage. Blocking SDK operations run outside the event loop."""

import asyncio
from functools import lru_cache
from typing import TYPE_CHECKING
from uuid import uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

from app.core.config import get_settings
from app.core.exceptions import AppError


@lru_cache
def get_storage_client() -> S3Client:
    settings = get_settings()
    if not settings.s3_bucket or not settings.s3_access_key or not settings.s3_secret_key:
        raise AppError("Object storage is not configured", status_code=503)
    return boto3.client(  # pyright: ignore[reportUnknownMemberType]
        "s3",
        endpoint_url=settings.s3_endpoint,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            connect_timeout=5,
            read_timeout=10,
            retries={"max_attempts": 2},
        ),
    )


async def upload_media(content: bytes, content_type: str) -> str:
    extensions = {"image/gif": "gif", "video/mp4": "mp4", "image/png": "png", "image/jpeg": "jpg"}
    if content_type not in extensions:
        raise AppError("Only GIF, MP4, PNG and JPEG files are supported", status_code=422)
    signatures = {
        "image/gif": content[:6] in (b"GIF87a", b"GIF89a"),
        "video/mp4": len(content) >= 12 and content[4:8] == b"ftyp",
        "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/jpeg": content.startswith(b"\xff\xd8\xff"),
    }
    if not signatures[content_type]:
        raise AppError("File signature does not match its content type", status_code=422)
    settings = get_settings()
    if not 0 < len(content) <= settings.media_max_bytes:
        raise AppError("Media file exceeds the upload limit", status_code=413)
    key = f"exercises/{uuid4()}.{extensions[content_type]}"
    client = get_storage_client()
    try:
        await asyncio.to_thread(
            client.put_object,
            Bucket=settings.s3_bucket or "",
            Key=key,
            Body=content,
            ContentType=content_type,
        )
    except (BotoCoreError, ClientError) as exc:
        raise AppError("Media upload temporarily unavailable", status_code=503) from exc
    return key


async def media_url(key: str) -> str:
    client = get_storage_client()
    return await asyncio.to_thread(
        client.generate_presigned_url,
        "get_object",
        Params={"Bucket": get_settings().s3_bucket, "Key": key},
        ExpiresIn=300,
    )
