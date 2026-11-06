import json
import hmac
import os
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import AdminCredential, StoreConfig
from .services.admin_auth import (
    PASSWORD_ITERATIONS,
    create_session_token,
    hash_password,
    random_hex,
    verify_password,
    verify_session_token,
)


COOKIE_NAME = "vm_admin_session"
TOKEN_SECONDS = 12 * 60 * 60
MAX_ATTEMPTS = 5
LOCK_SECONDS = 60


def _json_body(request):
    try:
        data = json.loads(request.body or "{}")
        return data if isinstance(data, dict) else None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _worker_authorized(request):
    expected = settings.WORKER_SHARED_SECRET
    received = request.headers.get("X-Worker-Secret", "")

    return (
        bool(expected)
        and bool(received)
        and hmac.compare_digest(expected, received)
    )


def _origin_allowed(request):
    origin = request.headers.get("Origin", "")

    allowed = {
        item.strip().rstrip("/")
        for item in os.getenv(
            "ADMIN_ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if item.strip()
    }

    return bool(origin) and origin.rstrip("/") in allowed


def _admin_request_allowed(request):
    return _worker_authorized(request)

def _set_session_cookie(response, token):
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=TOKEN_SECONDS,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/",
    )


def _clear_session_cookie(response):
    response.delete_cookie(
        COOKIE_NAME,
        path="/",
        samesite="Lax",
    )


def _authenticated_credential(request):
    token = request.COOKIES.get(COOKIE_NAME)

    if not token:
        return None

    credential = AdminCredential.objects.order_by("-updated_at").first()

    if not credential:
        return None

    if verify_session_token(token, credential.password_hash):
        return credential

    return None


@require_http_methods(["GET"])
def admin_status(request):
    credential = AdminCredential.objects.order_by("-updated_at").first()

    if not credential:
        return JsonResponse({
            "ok": True,
            "configured": False,
            "authenticated": False,
        })

    authenticated = _authenticated_credential(request) is not None

    return JsonResponse({
        "ok": True,
        "configured": True,
        "authenticated": authenticated,
    })


@csrf_exempt
@require_http_methods(["POST"])
def admin_setup(request):
    if not _admin_request_allowed(request):
        return JsonResponse(
            {"ok": False, "error": "origin_not_allowed"},
            status=403,
        )

    data = _json_body(request)

    if data is None:
        return JsonResponse(
            {"ok": False, "error": "invalid_data"},
            status=400,
        )

    password = data.get("password")

    if not isinstance(password, str) or not 8 <= len(password) <= 200:
        return JsonResponse(
            {"ok": False, "error": "invalid_password"},
            status=400,
        )

    with transaction.atomic():
        # A configuração da loja funciona como bloqueio para a
        # configuração inicial, pois essa linha já existe no banco.
        store = StoreConfig.objects.select_for_update().filter(pk=1).first()

        if not store:
            return JsonResponse(
                {"ok": False, "error": "store_not_configured"},
                status=409,
            )

        if AdminCredential.objects.exists():
            return JsonResponse(
                {"ok": False, "error": "already_configured"},
                status=409,
            )

        salt = random_hex()
        password_hash = hash_password(
            password,
            salt,
            PASSWORD_ITERATIONS,
        )
        now = timezone.now()

        credential = AdminCredential.objects.create(
            password_hash=password_hash,
            salt=salt,
            iterations=PASSWORD_ITERATIONS,
            failed_attempts=0,
            locked_until=None,
            password_updated_at=now,
            created_at=now,
            updated_at=now,
        )

    token = create_session_token(credential.password_hash)

    response = JsonResponse({"ok": True})
    _set_session_cookie(response, token)

    return response


@csrf_exempt
@require_http_methods(["POST"])
def admin_login(request):
    if not _admin_request_allowed(request):
        return JsonResponse(
            {"ok": False, "error": "origin_not_allowed"},
            status=403,
        )

    data = _json_body(request)

    if data is None:
        return JsonResponse(
            {"ok": False, "error": "invalid_data"},
            status=400,
        )

    password = data.get("password")

    if not isinstance(password, str) or not password or len(password) > 200:
        return JsonResponse(
            {"ok": False, "error": "invalid_password"},
            status=400,
        )

    with transaction.atomic():
        credential = (
            AdminCredential.objects
            .select_for_update()
            .order_by("-updated_at")
            .first()
        )

        if not credential:
            return JsonResponse(
                {"ok": False, "error": "not_configured"},
                status=404,
            )

        now = timezone.now()

        if credential.locked_until and credential.locked_until > now:
            seconds = max(
                1,
                int((credential.locked_until - now).total_seconds()),
            )
            return JsonResponse(
                {
                    "ok": False,
                    "error": "locked",
                    "seconds": seconds,
                },
                status=429,
            )

        valid = verify_password(
            password,
            credential.salt,
            credential.password_hash,
            credential.iterations,
        )

        if not valid:
            credential.failed_attempts += 1

            if credential.failed_attempts >= MAX_ATTEMPTS:
                credential.failed_attempts = 0
                credential.locked_until = now + timedelta(
                    seconds=LOCK_SECONDS
                )

                credential.save(update_fields=[
                    "failed_attempts",
                    "locked_until",
                ])

                return JsonResponse(
                    {
                        "ok": False,
                        "error": "locked",
                        "seconds": LOCK_SECONDS,
                    },
                    status=429,
                )

            credential.save(update_fields=["failed_attempts"])

            return JsonResponse(
                {
                    "ok": False,
                    "error": "invalid",
                    "attempts_left": MAX_ATTEMPTS - credential.failed_attempts,
                },
                status=401,
            )

        credential.failed_attempts = 0
        credential.locked_until = None
        credential.save(update_fields=[
            "failed_attempts",
            "locked_until",
        ])

        password_hash = credential.password_hash

    token = create_session_token(password_hash)

    response = JsonResponse({"ok": True})
    _set_session_cookie(response, token)

    return response


@csrf_exempt
@require_http_methods(["POST"])
def admin_logout(request):
    if not _admin_request_allowed(request):
        return JsonResponse(
            {"ok": False, "error": "origin_not_allowed"},
            status=403,
        )

    response = JsonResponse({"ok": True})
    _clear_session_cookie(response)

    return response
