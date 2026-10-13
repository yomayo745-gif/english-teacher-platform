import os
import uuid
import aiofiles
from pathlib import Path
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
import mutagen

from app.core.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
AUDIO_DIR = UPLOAD_DIR / "audio"
IMAGES_DIR = UPLOAD_DIR / "images"
DOCS_DIR = UPLOAD_DIR / "docs"

# Ensure directories exist
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DOCS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".docx", ".txt"}

ALL_ALLOWED_EXTENSIONS = ALLOWED_AUDIO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOC_EXTENSIONS

def get_file_category(extension: str) -> Optional[str]:
    ext = extension.lower()
    if ext in ALLOWED_AUDIO_EXTENSIONS:
        return "audio"
    if ext in ALLOWED_IMAGE_EXTENSIONS:
        return "images"
    if ext in ALLOWED_DOC_EXTENSIONS:
        return "docs"
    return None

async def save_uploaded_file(file: UploadFile) -> Tuple[str, str, int, Optional[float]]:
    """
    Saves an uploaded file to storage.
    Returns: (file_url, file_path, file_size, audio_duration_seconds)
    """
    original_filename = file.filename or "file.bin"
    ext = Path(original_filename).suffix.lower()
    
    category = get_file_category(ext)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not supported. Allowed formats: audio, images, PDF/DOCX/TXT documents."
        )

    target_dir = UPLOAD_DIR / category
    target_dir.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = target_dir / unique_filename

    # Read and validate size
    size = 0
    duration = None

    async with aiofiles.open(destination_path, "wb") as out_file:
        while content := await file.read(1024 * 1024):  # 1MB chunks
            size += len(content)
            if size > settings.MAX_UPLOAD_SIZE_BYTES:
                if destination_path.exists():
                    destination_path.unlink()
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024):.1f}MB"
                )
            await out_file.write(content)

    # If it's an audio file, extract duration using mutagen
    if category == "audio":
        try:
            audio_info = mutagen.File(str(destination_path))
            if audio_info is not None and hasattr(audio_info, "info") and hasattr(audio_info.info, "length"):
                duration = round(float(audio_info.info.length), 2)
        except Exception:
            duration = None

    # Construct accessible relative file URL
    file_url = f"/api/v1/media/{category}/{unique_filename}"
    return file_url, str(destination_path), size, duration

def range_streamer(file_path: Path, start: int, end: int, chunk_size: int = 64 * 1024):
    with open(file_path, "rb") as f:
        f.seek(start)
        bytes_to_read = end - start + 1
        while bytes_to_read > 0:
            read_size = min(chunk_size, bytes_to_read)
            data = f.read(read_size)
            if not data:
                break
            bytes_to_read -= len(data)
            yield data

def stream_media_file(file_path: Path, range_header: Optional[str] = None, media_type: str = "application/octet-stream"):
    """
    Streams media file with support for HTTP 206 Partial Content (byte-range seeking).
    """
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    file_size = file_path.stat().st_size

    if range_header:
        # Parse range header e.g. 'bytes=100-200' or 'bytes=100-'
        try:
            range_val = range_header.replace("bytes=", "").strip()
            parts = range_val.split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1
            start = max(0, start)
            end = min(file_size - 1, end)
        except Exception:
            start = 0
            end = file_size - 1

        content_length = end - start + 1
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": media_type,
        }
        return StreamingResponse(
            range_streamer(file_path, start, end),
            status_code=206,
            headers=headers
        )

    # Full content response
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": media_type,
    }
    return StreamingResponse(
        range_streamer(file_path, 0, file_size - 1),
        status_code=200,
        headers=headers
    )
