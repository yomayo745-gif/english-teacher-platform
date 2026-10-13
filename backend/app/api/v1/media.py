import mimetypes
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Header, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.storage import save_uploaded_file, stream_media_file, UPLOAD_DIR

router = APIRouter(prefix="/media", tags=["Media & Uploads"])

class UploadResponse(BaseModel):
    file_url: str
    filename: str
    file_size: int
    duration: Optional[float] = None
    category: str

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a media file (audio, image, document).
    Extracts audio duration automatically using Mutagen.
    """
    try:
        file_url, file_path, size, duration = await save_uploaded_file(file)
        category = Path(file_path).parent.name
        return UploadResponse(
            file_url=file_url,
            filename=Path(file_path).name,
            file_size=size,
            duration=duration,
            category=category
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/{category}/{filename}")
async def get_media_file(category: str, filename: str, range: Optional[str] = Header(None)):
    """
    Serves media files with HTTP 206 Partial Content (range requests)
    for seamless, efficient audio and video streaming.
    """
    if category not in ["audio", "images", "docs"]:
        raise HTTPException(status_code=404, detail="Category not found")

    category_dir = (UPLOAD_DIR / category).resolve()
    target_file = (category_dir / filename).resolve()

    # Prevent path traversal
    if not str(target_file).startswith(str(category_dir)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    mime_type, _ = mimetypes.guess_type(str(target_file))
    if not mime_type:
        if category == "audio":
            mime_type = "audio/mpeg"
        elif category == "images":
            mime_type = "image/jpeg"
        else:
            mime_type = "application/octet-stream"

    return stream_media_file(target_file, range_header=range, media_type=mime_type)
