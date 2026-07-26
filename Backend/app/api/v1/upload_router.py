from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
import os
import uuid
import hmac
import hashlib
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter(tags=["upload"])

def get_user_dir_name(user_id: int) -> str:
    # Hash the user ID using the JWT secret to prevent enumeration
    msg = str(user_id).encode('utf-8')
    key = settings.JWT_SECRET.encode('utf-8')
    hashed = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return hashed[:16] # Use first 16 chars for directory name

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate user-specific encrypted directory
    user_dir_name = get_user_dir_name(current_user.id)
    upload_dir = os.path.join("uploads", user_dir_name)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return the full URL path
    base_url = str(request.base_url)
    if base_url.endswith("/"):
        base_url = base_url[:-1]
    return {"url": f"{base_url}/uploads/{user_dir_name}/{unique_filename}"}
