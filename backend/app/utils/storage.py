import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, status

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def save_upload(file: UploadFile, subfolder: str) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPEG, PNG, or WEBP images are allowed.")

    contents = file.file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Image exceeds {settings.MAX_UPLOAD_MB}MB limit.")

    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"

    folder = Path(settings.UPLOAD_DIR) / subfolder
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / filename
    with open(path, "wb") as f:
        f.write(contents)

    # Served by FastAPI StaticFiles mount at /uploads
    return f"/uploads/{subfolder}/{filename}"
