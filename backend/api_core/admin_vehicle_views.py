
import json
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q, Prefetch, Count
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import Vehicle, VehicleImage, VehicleFeature, Lead
from .admin_auth_views import (
    _admin_request_allowed,
    _authenticated_credential,
)


def _error(message, status=400):
    return JsonResponse({
        "ok": False,
        "error": message,
    }, status=status)


def _read_json(request):
    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None

    return data if isinstance(data, dict) else None


def _text(data, field, maximum, default=""):
    value = data.get(field, default)

    if value is None:
        value = ""

    if not isinstance(value, str):
        raise ValueError(f"Campo inválido: {field}.")

    value = value.strip()

    if len(value) > maximum:
        raise ValueError(f"O campo {field} excede o limite permitido.")

    return value


def _integer(data, field, minimum, maximum, default=None, nullable=False):
    value = data.get(field, default)

    if value is None or value == "":
        if nullable:
            return None
        raise ValueError(f"Informe o campo {field}.")

    if isinstance(value, bool):
        raise ValueError(f"Valor inválido para {field}.")

    try:
        number = int(value)
    except (ValueError, TypeError, OverflowError):
        raise ValueError(f"Valor inválido para {field}.")

    if str(number) != str(value) and not isinstance(value, int):
        raise ValueError(f"Valor inválido para {field}.")

    if not minimum <= number <= maximum:
        raise ValueError(f"Valor fora do limite para {field}.")

    return number


def _decimal(data, field):
    value = data.get(field)

    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Informe um preço válido.")

    if not number.is_finite() or number < 0 or number > Decimal("100000000"):
        raise ValueError("Preço fora do limite permitido.")

    return number


def _boolean(data, field, default=False):
    value = data.get(field, default)

    if not isinstance(value, bool):
        raise ValueError(f"Valor inválido para {field}.")

    return value


def _string_list(data, field, maximum_items=80):
    value = data.get(field, [])

    if not isinstance(value, list) or len(value) > maximum_items:
        raise ValueError(f"Lista inválida: {field}.")

    result = []

    for item in value:
        if not isinstance(item, str):
            raise ValueError(f"Item inválido na lista {field}.")

        item = item.strip()

        if not item or len(item) > 80:
            raise ValueError(f"Item inválido na lista {field}.")

        result.append(item)

    return result


def _image_list(data):
    images = data.get("images", [])

    if not isinstance(images, list) or len(images) > 12:
        raise ValueError("O anúncio pode ter no máximo 12 fotos.")

    result = []

    for url in images:
        if not isinstance(url, str):
            raise ValueError("Endereço de imagem inválido.")

        url = url.strip()

        if not url or len(url) > 500:
            raise ValueError("Endereço de imagem inválido.")

        if not url.startswith(("https://", "http://")):
            raise ValueError("A imagem precisa ter um endereço HTTP ou HTTPS.")

        result.append(url)

    return result


def _prepare_vehicle_data(data):
    status = _text(data, "status", 10, "available")

    if status not in ("available", "paused", "sold"):
        raise ValueError("Situação do anúncio inválida.")

    vehicle_data = {
        "brand": _text(data, "brand", 60),
        "model": _text(data, "model", 80),
        "version": _text(data, "version", 120),
        "year_manufacture": _integer(
            data, "year_manufacture", 1900, 2100,
            nullable=True,
        ),
        "year_model": _integer(data, "year_model", 1900, 2100),
        "price": _decimal(data, "price"),
        "mileage": _integer(data, "mileage", 0, 3000000, default=0),
        "fuel": _text(data, "fuel", 10, "Flex"),
        "transmission": _text(data, "transmission", 13, "Manual"),
        "color": _text(data, "color", 40),
        "category": _text(data, "category", 10, "Seminovo"),
        "body_type": _text(data, "body_type", 12, "Hatch"),
        "doors": _integer(
            data, "doors", 0, 10,
            nullable=True,
        ),
        "engine": _text(data, "engine", 60),
        "power": _text(data, "power", 60),
        "description": _text(data, "description", 6000),
        "notes": _text(data, "notes", 2000),
        "status": status,
        "featured": _boolean(data, "featured"),
    }

    if not vehicle_data["brand"] or not vehicle_data["model"]:
        raise ValueError("Informe a marca e o modelo do veículo.")

    features = _string_list(data, "features")
    equipment = _string_list(data, "equipment")
    images = _image_list(data)

    return vehicle_data, features, equipment, images


@csrf_exempt
def admin_save_vehicle(request, vehicle_id=None):
    if request.method not in ("POST", "PATCH"):
        return _error("Método não permitido.", 405)

    if not _admin_request_allowed(request):
        return _error("Comunicação não autorizada.", 403)

    if not _authenticated_credential(request):
        return _error("Sessão administrativa inválida.", 401)

    if vehicle_id is None and request.method != "POST":
        return _error("Método não permitido.", 405)

    if vehicle_id is not None and request.method != "PATCH":
        return _error("Método não permitido.", 405)

    data = _read_json(request)

    if data is None:
        return _error("Dados inválidos.")

    try:
        vehicle_data, features, equipment, images = (
            _prepare_vehicle_data(data)
        )
    except ValueError as error:
        return _error(str(error))

    now = timezone.now()

    try:
        with transaction.atomic():
            if vehicle_id is None:
                vehicle = Vehicle.objects.create(
                    **vehicle_data,
                    is_demo=False,
                    created_at=now,
                    updated_at=now,
                )
            else:
                vehicle = (
                    Vehicle.objects
                    .select_for_update()
                    .filter(pk=vehicle_id)
                    .first()
                )

                if not vehicle:
                    return _error("Veículo não encontrado.", 404)

                for field, value in vehicle_data.items():
                    setattr(vehicle, field, value)

                vehicle.updated_at = now
                vehicle.save()

            VehicleFeature.objects.filter(vehicle=vehicle).delete()
            VehicleImage.objects.filter(vehicle=vehicle).delete()

            feature_records = []

            for position, label in enumerate(features):
                feature_records.append(
                    VehicleFeature(
                        vehicle=vehicle,
                        kind="feature",
                        label=label,
                        position=position,
                    )
                )

            for position, label in enumerate(equipment):
                feature_records.append(
                    VehicleFeature(
                        vehicle=vehicle,
                        kind="equipment",
                        label=label,
                        position=position,
                    )
                )

            if feature_records:
                VehicleFeature.objects.bulk_create(feature_records)

            image_records = [
                VehicleImage(
                    vehicle=vehicle,
                    image_url=url,
                    position=position,
                    is_main=(position == 0),
                    created_at=now,
                )
                for position, url in enumerate(images)
            ]

            if image_records:
                VehicleImage.objects.bulk_create(image_records)

        return JsonResponse({
            "ok": True,
            "id": vehicle.id,
        }, status=201 if vehicle_id is None else 200)

    except Exception:
        return _error(
            "Não foi possível salvar o anúncio. Verifique os dados e tente novamente.",
            500,
        )


@csrf_exempt
def admin_list_vehicles(request):
    if request.method != "GET":
        return _error("Método não permitido.", 405)

    if not _admin_request_allowed(request):
        return _error("Comunicação não autorizada.", 403)

    if not _authenticated_credential(request):
        return _error("Sessão administrativa inválida.", 401)

    params = request.GET
    queryset = Vehicle.objects.all()

    status = params.get("status", "all")
    if status not in ("all", "available", "paused", "sold"):
        return _error("Filtro de situação inválido.")

    if status != "all":
        queryset = queryset.filter(status=status)

    search = params.get("q", "").strip()[:80]
    if search:
        queryset = queryset.filter(
            Q(brand__icontains=search)
            | Q(model__icontains=search)
            | Q(version__icontains=search)
        )

    total = queryset.count()

    queryset = queryset.prefetch_related(
        Prefetch(
            "images",
            queryset=VehicleImage.objects.order_by(
                "-is_main", "position", "id"
            ),
        ),
        Prefetch(
            "features",
            queryset=VehicleFeature.objects.order_by(
                "kind", "position", "id"
            ),
        ),
    ).order_by("-created_at", "-id")

    try:
        limit = int(params.get("limit", 24))
    except (ValueError, TypeError):
        return _error("Limite inválido.")

    if not 1 <= limit <= 36:
        return _error("O limite deve estar entre 1 e 36.")

    try:
        offset = int(params.get("offset", 0))
    except (ValueError, TypeError):
        return _error("Paginação inválida.")

    if offset < 0 or offset > 100000:
        return _error("Paginação inválida.")

    vehicles = list(queryset[offset:offset + limit + 1])
    has_more = len(vehicles) > limit
    vehicles = vehicles[:limit]

    from .views import serialize_vehicle

    return JsonResponse({
        "ok": True,
        "items": [serialize_vehicle(vehicle) for vehicle in vehicles],
        "total": total,
        "has_more": has_more,
        "next_cursor": str(offset + limit) if has_more else None,
    })

@csrf_exempt
def admin_get_vehicle(request, vehicle_id):
    if request.method != "GET":
        return _error("Método não permitido.", 405)

    if not _admin_request_allowed(request):
        return _error("Comunicação não autorizada.", 403)

    if not _authenticated_credential(request):
        return _error("Sessão administrativa inválida.", 401)

    vehicle = (
        Vehicle.objects
        .prefetch_related("images", "features")
        .filter(pk=vehicle_id)
        .first()
    )

    if not vehicle:
        return _error("Veículo não encontrado.", 404)

    from .views import serialize_vehicle

    return JsonResponse({
        "ok": True,
        "vehicle": serialize_vehicle(vehicle),
    })


@csrf_exempt
def admin_quick_update_vehicle(request, vehicle_id):
    if request.method != "PATCH":
        return _error("Método não permitido.", 405)

    if not _admin_request_allowed(request):
        return _error("Comunicação não autorizada.", 403)

    if not _authenticated_credential(request):
        return _error("Sessão administrativa inválida.", 401)

    data = _read_json(request)

    if data is None:
        return _error("Dados inválidos.")

    allowed_fields = {"status", "featured", "price"}

    if not data or not set(data.keys()).issubset(allowed_fields):
        return _error("Campos de atualização inválidos.")

    vehicle = Vehicle.objects.filter(pk=vehicle_id).first()

    if not vehicle:
        return _error("Veículo não encontrado.", 404)

    try:
        update_fields = []

        if "status" in data:
            status = _text(data, "status", 10)

            if status not in ("available", "paused", "sold"):
                raise ValueError("Situação do anúncio inválida.")

            vehicle.status = status
            update_fields.append("status")

        if "featured" in data:
            vehicle.featured = _boolean(data, "featured")
            update_fields.append("featured")

        if "price" in data:
            vehicle.price = _decimal(data, "price")
            update_fields.append("price")

    except ValueError as error:
        return _error(str(error))

    vehicle.updated_at = timezone.now()
    update_fields.append("updated_at")

    vehicle.save(update_fields=update_fields)

    from .views import serialize_vehicle

    return JsonResponse({
        "ok": True,
        "vehicle": serialize_vehicle(vehicle),
    })


@csrf_exempt
def admin_delete_vehicle(request, vehicle_id):
    if request.method != "DELETE":
        return _error("Método não permitido.", 405)

    if not _admin_request_allowed(request):
        return _error("Comunicação não autorizada.", 403)

    if not _authenticated_credential(request):
        return _error("Sessão administrativa inválida.", 401)

    vehicle = Vehicle.objects.filter(pk=vehicle_id).first()

    if not vehicle:
        return _error("Veículo não encontrado.", 404)

    try:
        with transaction.atomic():
            vehicle.delete()

        return JsonResponse({"ok": True})

    except Exception:
        return _error("Não foi possível excluir o veículo.", 500)


@csrf_exempt
def admin_vehicle_detail(request, vehicle_id):
    if request.method == "GET":
        return admin_get_vehicle(request, vehicle_id)

    if request.method == "PATCH":
        return admin_save_vehicle(request, vehicle_id)

    if request.method == "DELETE":
        return admin_delete_vehicle(request, vehicle_id)

    return _error("Método não permitido.", 405)

def admin_dashboard(request):
    if request.method != "GET":
        return JsonResponse(
            {"ok": False, "error": "method_not_allowed"},
            status=405,
        )

    if not _admin_request_allowed(request) or not _authenticated_credential(request):
        return JsonResponse(
            {"ok": False, "error": "unauthorized"},
            status=401,
        )

    counts = {
        "total": Vehicle.objects.count(),
        "available": Vehicle.objects.filter(status="available").count(),
        "sold": Vehicle.objects.filter(status="sold").count(),
        "paused": Vehicle.objects.filter(status="paused").count(),
        "featured": Vehicle.objects.filter(featured=True).count(),
        "leadsTotal": Lead.objects.count(),
        "leadsNew": Lead.objects.filter(status="new").count(),
    }

    brands = list(
        Vehicle.objects.values("brand")
        .annotate(count=Count("id"))
        .order_by("-count")[:6]
    )

    brands = [
        {
            "brand": item["brand"] or "—",
            "count": item["count"],
        }
        for item in brands
    ]

    leads = list(
        Lead.objects.values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    recent_leads = Lead.objects.order_by("-created_at")[:6]

    recent_leads_data = [
        {
            "id": lead.id,
            "name": lead.name,
            "phone": lead.phone,
            "vehicle_label": lead.vehicle_label,
            "status": lead.status,
            "created_date": lead.created_at.isoformat() if lead.created_at else None,
        }
        for lead in recent_leads
    ]

    return JsonResponse({
        "ok": True,
        "counts": counts,
        "brands": brands,
        "leads": leads,
        "recentLeads": recent_leads_data,
    })
