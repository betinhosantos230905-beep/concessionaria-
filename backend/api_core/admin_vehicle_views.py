
import json
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import Vehicle, VehicleImage, VehicleFeature
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
