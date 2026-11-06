
import base64
import binascii
import io
import os
import re

import cloudinary
import cloudinary.uploader

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .admin_auth_views import (
    _admin_request_allowed,
    _authenticated_credential,
)


MAX_IMAGE_BYTES = 15 * 1024 * 1024
MAX_BASE64_LENGTH = 21_000_000

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_FOLDERS = {
    "vehicles": "vassouras-motos/veiculos",
    "store": "vassouras-motos/loja",
}


def _upload_error(message, status=400):
    return JsonResponse(
        {"ok": False, "error": message},
        status=status,
    )


@csrf_exempt
def admin_upload_image(request):
    if request.method != "POST":
        return _upload_error("method_not_allowed", 405)

    if not _admin_request_allowed(request):
        return _upload_error("unauthorized", 401)

    if not _authenticated_credential(request):
        return _upload_error("unauthorized", 401)

    try:
        import json

        data = json.loads(request.body or b"{}")

        filename = str(data.get("filename", "image.jpg"))
        content_type = data.get("contentType")
        data_base64 = data.get("dataBase64", "")
        folder_key = data.get("folder")

        if content_type not in ALLOWED_CONTENT_TYPES:
            return _upload_error("invalid_content_type")

        folder = ALLOWED_FOLDERS.get(folder_key)

        if not folder:
            return _upload_error("invalid_folder")

        if (
            not isinstance(data_base64, str)
            or not data_base64
            or len(data_base64) > MAX_BASE64_LENGTH
        ):
            return _upload_error("invalid_image_data")

        image_bytes = base64.b64decode(
            data_base64,
            validate=True,
        )

        if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
            return _upload_error("invalid_image_size")

        if content_type == "image/jpeg":
            valid_signature = image_bytes.startswith(b"\xff\xd8\xff")
        elif content_type == "image/png":
            valid_signature = image_bytes.startswith(
                b"\x89PNG\r\n\x1a\n"
            )
        else:
            valid_signature = (
                len(image_bytes) >= 12
                and image_bytes[:4] == b"RIFF"
                and image_bytes[8:12] == b"WEBP"
            )

        if not valid_signature:
            return _upload_error("invalid_image_format")

        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")

        if not all([cloud_name, api_key, api_secret]):
            return _upload_error(
                "cloudinary_not_configured",
                503,
            )

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )

        safe_filename = os.path.basename(filename)
        safe_filename = re.sub(
            r"[^a-zA-Z0-9_.-]",
            "-",
            safe_filename,
        )[:120]

        uploaded = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            folder=folder,
            public_id=os.path.splitext(safe_filename)[0],
            resource_type="image",
            overwrite=False,
            unique_filename=True,
            use_filename=True,
        )

        image_url = uploaded.get("secure_url")

        if not image_url:
            return _upload_error("upload_failed", 502)

        return JsonResponse({
            "ok": True,
            "url": image_url,
        })

    except (ValueError, binascii.Error):
        return _upload_error("invalid_image_data")

    except Exception:
        return _upload_error("upload_failed", 502)
