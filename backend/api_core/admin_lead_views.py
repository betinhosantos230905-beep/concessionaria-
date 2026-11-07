
import json

from django.db.models import Count
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import Lead
from .admin_auth_views import (
    _admin_request_allowed,
    _authenticated_credential,
)


VALID_STATUSES = ("new", "in_progress", "done")


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
def admin_list_leads(request):
    if request.method != "GET":
        return _error("Método não permitido.", 405)

    if not _authorized(request):
        return _error("Sessão administrativa inválida.", 401)

    status = request.GET.get("status", "all")

    if status not in ("all", *VALID_STATUSES):
        return _error("Filtro de atendimento inválido.")

    queryset = Lead.objects.all()

    counts = list(
        Lead.objects.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    if status != "all":
        queryset = queryset.filter(status=status)

    leads = queryset.order_by("-created_at", "-id")[:60]

    items = [
        {
            "id": lead.id,
            "name": lead.name,
            "phone": lead.phone,
            "email": lead.email,
            "message": lead.message or "",
            "vehicle_label": lead.vehicle_label or "",
            "status": lead.status,
            "internal_notes": lead.internal_notes or "",
            "created_date": (
                lead.created_at.isoformat()
                if lead.created_at else None
            ),
        }
        for lead in leads
    ]

    return JsonResponse({
        "ok": True,
        "items": items,
        "counts": counts,
    })


@csrf_exempt
def admin_update_lead(request, lead_id):
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

    allowed_fields = {"status", "internal_notes"}

    if not set(data).issubset(allowed_fields):
        return _error("Campos de atualização inválidos.")

    lead = Lead.objects.filter(pk=lead_id).first()

    if not lead:
        return _error("Interessado não encontrado.", 404)

    update_fields = []

    if "status" in data:
        status = data["status"]

        if not isinstance(status, str) or status not in VALID_STATUSES:
            return _error("Status de atendimento inválido.")

        lead.status = status
        update_fields.append("status")

    if "internal_notes" in data:
        notes = data["internal_notes"]

        if not isinstance(notes, str):
            return _error("Anotação inválida.")

        notes = notes.strip()

        if len(notes) > 2000:
            return _error("A anotação excede o limite permitido.")

        lead.internal_notes = notes or None
        update_fields.append("internal_notes")

    lead.updated_at = timezone.now()
    update_fields.append("updated_at")

    lead.save(update_fields=update_fields)

    return JsonResponse({
        "ok": True,
        "lead": {
            "id": lead.id,
            "status": lead.status,
            "internal_notes": lead.internal_notes or "",
        },
    })
