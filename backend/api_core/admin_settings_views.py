
import json

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import StoreConfig
from .admin_auth_views import (
    _admin_request_allowed,
    _authenticated_credential,
)


def _error(message, status=400):
    return JsonResponse({
        "ok": False,
        "error": message,
    }, status=status)


def _authorized(request):
    return (
        _admin_request_allowed(request)
        and _authenticated_credential(request)
    )


@csrf_exempt
def admin_save_settings(request):
    if request.method != "PATCH":
        return _error("Método não permitido.", 405)

    if not _authorized(request):
        return _error("Sessão administrativa inválida.", 401)

    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return _error("Dados inválidos.")

    if not isinstance(data, dict) or not data:
        return _error("Dados inválidos.")

    limits = {
        "name": 120,
        "tagline": 120,
        "logo_url": 500,
        "hero_image": 500,
        "store_image": 500,
        "whatsapp": 30,
        "phone": 30,
        "address": 200,
        "city": 80,
        "state": 2,
        "opening_hours": 300,
        "instagram": 200,
        "facebook": 300,
        "about_text": 10000,
    }

    if not set(data).issubset(limits):
        return _error("Campos de configuração inválidos.")

    for field, value in data.items():
        if not isinstance(value, str):
            return _error(f"Valor inválido para {field}.")

        value = value.strip()

        if len(value) > limits[field]:
            return _error(f"O campo {field} excede o limite permitido.")

        data[field] = value

    if not data.get("name"):
        return _error("O nome da loja é obrigatório.")

    store = StoreConfig.objects.order_by("id").first()

    if not store:
        return _error("Configuração da loja não encontrada.", 404)

    for field, value in data.items():
        setattr(store, field, value or None if field == "about_text" else value)

    store.updated_at = timezone.now()

    store.save(update_fields=[*data.keys(), "updated_at"])

    settings = {
        field: getattr(store, field) or ""
        for field in limits
    }

    return JsonResponse({
        "ok": True,
        "settings": settings,
    })
