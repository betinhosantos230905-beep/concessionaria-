
import base64
import json
from decimal import Decimal, InvalidOperation
from django.views.decorators.csrf import csrf_exempt
from .admin_auth_views import _admin_request_allowed
from django.db.models import Q, Prefetch
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import StoreConfig, Vehicle, VehicleImage, VehicleFeature, Lead


def health_check(request):
    return JsonResponse({
        "status": "online",
        "message": "API Vassouras Motos funcionando!",
        "service": "vassouras-motos-api",
        "timestamp": timezone.now().isoformat(),
    })


def get_store(request):
    if request.method != "GET":
        return JsonResponse({"error": "Método não permitido."}, status=405)

    store = StoreConfig.objects.order_by("-updated_at").first()

    if not store:
        return JsonResponse(None, safe=False)

    data = {
        "id": store.id,
        "name": store.name,
        "tagline": store.tagline,
        "logo_url": store.logo_url,
        "hero_image": store.hero_image,
        "store_image": store.store_image,
        "whatsapp": store.whatsapp,
        "phone": store.phone,
        "address": store.address,
        "city": store.city,
        "state": store.state,
        "opening_hours": store.opening_hours,
        "instagram": store.instagram,
        "facebook": store.facebook,
        "about_text": store.about_text,
    }

    return JsonResponse(data)


def serialize_vehicle(vehicle):
    images = [image.image_url for image in vehicle.images.all()]

    features = []
    equipment = []

    for item in vehicle.features.all():
        if item.kind == "feature":
            features.append(item.label)
        elif item.kind == "equipment":
            equipment.append(item.label)

    return {
        "id": vehicle.id,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "version": vehicle.version,
        "year_manufacture": vehicle.year_manufacture,
        "year_model": vehicle.year_model,
        "price": float(vehicle.price),
        "mileage": vehicle.mileage,
        "fuel": vehicle.fuel,
        "transmission": vehicle.transmission,
        "color": vehicle.color,
        "category": vehicle.category,
        "body_type": vehicle.body_type,
        "doors": vehicle.doors,
        "engine": vehicle.engine,
        "power": vehicle.power,
        "description": vehicle.description,
        "notes": vehicle.notes,
        "status": vehicle.status,
        "featured": vehicle.featured,
        "is_demo": vehicle.is_demo,
        "views": vehicle.views,
        "created_at": vehicle.created_at.isoformat() if vehicle.created_at else None,
        "updated_at": vehicle.updated_at.isoformat() if vehicle.updated_at else None,
        "images": images,
        "features": features,
        "equipment": equipment,
    }


def encode_cursor(data):
    raw = json.dumps(data, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_cursor(value):
    try:
        padded = value + "=" * (-len(value) % 4)
        raw = base64.urlsafe_b64decode(padded.encode("ascii"))
        data = json.loads(raw.decode("utf-8"))

        if not isinstance(data, dict):
            return None

        return data
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        return None


def get_vehicles(request):
    if request.method != "GET":
        return JsonResponse({"error": "Método não permitido."}, status=405)

    params = request.GET
    queryset = Vehicle.objects.filter(status="available")

    search = params.get("q", "").strip()

    if len(search) > 80:
        return JsonResponse({"error": "A busca deve ter no máximo 80 caracteres."}, status=400)

    if search:
        queryset = queryset.filter(
            Q(brand__icontains=search)
            | Q(model__icontains=search)
            | Q(version__icontains=search)
        )

    text_filters = {
        "brand": "brand",
        "body_type": "body_type",
        "category": "category",
        "fuel": "fuel",
        "transmission": "transmission",
    }

    for parameter, field in text_filters.items():
        value = params.get(parameter, "").strip()
        if value:
            queryset = queryset.filter(**{field: value})

    numeric_filters = {
        "year_min": ("year_model__gte", int),
        "year_max": ("year_model__lte", int),
        "price_min": ("price__gte", Decimal),
        "price_max": ("price__lte", Decimal),
        "mileage_max": ("mileage__lte", int),
    }

    for parameter, (lookup, converter) in numeric_filters.items():
        value = params.get(parameter)

        if value:
            try:
                converted = converter(value)

                if isinstance(converted, Decimal) and not converted.is_finite():
                    raise ValueError()

                queryset = queryset.filter(**{lookup: converted})

            except (ValueError, InvalidOperation, TypeError):
                return JsonResponse(
                    {"error": f"Valor inválido para o filtro {parameter}."},
                    status=400,
                )

    featured_only = params.get("featured_only", "").lower()

    if featured_only in ("true", "1", "yes"):
        queryset = queryset.filter(featured=True)

    total = queryset.count()

    sort = params.get("sort", "recent")

    sort_options = {
        "recent": ("-created_at", "-id"),
        "price_asc": ("price", "id"),
        "price_desc": ("-price", "-id"),
        "km_asc": ("mileage", "id"),
    }

    if sort not in sort_options:
        return JsonResponse({"error": "Ordenação inválida."}, status=400)

    try:
        limit = int(params.get("limit", 12))
    except ValueError:
        return JsonResponse({"error": "Limite inválido."}, status=400)

    if not 1 <= limit <= 36:
        return JsonResponse(
            {"error": "O limite deve estar entre 1 e 36."},
            status=400,
        )

    queryset = queryset.order_by(*sort_options[sort])

    cursor_value = params.get("cursor")

    if cursor_value:
        cursor = decode_cursor(cursor_value)

        if not cursor or cursor.get("sort") != sort:
            return JsonResponse({"error": "Cursor inválido."}, status=400)

        try:
            vehicle_id = int(cursor["id"])

            if sort == "recent":
                created_at = parse_datetime(cursor["created_at"])
                if not created_at:
                    raise ValueError()

                queryset = queryset.filter(
                    Q(created_at__lt=created_at)
                    | Q(created_at=created_at, id__lt=vehicle_id)
                )

            elif sort in ("price_asc", "price_desc"):
                price = Decimal(str(cursor["value"]))

                if not price.is_finite():
                    raise ValueError()

                if sort == "price_asc":
                    queryset = queryset.filter(
                        Q(price__gt=price)
                        | Q(price=price, id__gt=vehicle_id)
                    )
                else:
                    queryset = queryset.filter(
                        Q(price__lt=price)
                        | Q(price=price, id__lt=vehicle_id)
                    )

            elif sort == "km_asc":
                mileage = int(cursor["value"])

                queryset = queryset.filter(
                    Q(mileage__gt=mileage)
                    | Q(mileage=mileage, id__gt=vehicle_id)
                )

        except (KeyError, ValueError, TypeError, InvalidOperation):
            return JsonResponse({"error": "Cursor inválido."}, status=400)

    queryset = queryset.prefetch_related(
        Prefetch(
            "images",
            queryset=VehicleImage.objects.order_by("-is_main", "position", "id"),
        ),
        Prefetch(
            "features",
            queryset=VehicleFeature.objects.order_by("kind", "position", "id"),
        ),
    )

    results = list(queryset[:limit + 1])

    has_more = len(results) > limit
    vehicles = results[:limit]

    items = [serialize_vehicle(vehicle) for vehicle in vehicles]

    next_cursor = None

    if has_more and vehicles:
        last = vehicles[-1]

        cursor_data = {
            "sort": sort,
            "id": last.id,
        }

        if sort == "recent":
            cursor_data["created_at"] = last.created_at.isoformat()
        elif sort in ("price_asc", "price_desc"):
            cursor_data["value"] = str(last.price)
        elif sort == "km_asc":
            cursor_data["value"] = last.mileage

        next_cursor = encode_cursor(cursor_data)

    return JsonResponse({
        "items": items,
        "total": total,
        "has_more": has_more,
        "next_cursor": next_cursor,
    })

def get_catalog_facets(request):
    if request.method != "GET":
        return JsonResponse(
            {"error": "Método não permitido."},
            status=405,
        )

    queryset = Vehicle.objects.filter(status="available")

    brands = list(
        queryset
        .exclude(brand="")
        .values_list("brand", flat=True)
        .distinct()
        .order_by("brand")
    )

    total = queryset.count()

    return JsonResponse({
        "brands": brands,
        "total": total,
    })

def get_home_data(request):
    if request.method != "GET":
        return JsonResponse(
            {"error": "Método não permitido."},
            status=405,
        )

    queryset = Vehicle.objects.filter(status="available").prefetch_related(
        Prefetch(
            "images",
            queryset=VehicleImage.objects.order_by("-is_main", "position", "id"),
        ),
        Prefetch(
            "features",
            queryset=VehicleFeature.objects.order_by("kind", "position", "id"),
        ),
    )

    total = queryset.count()

    featured_vehicles = queryset.filter(
        featured=True
    ).order_by("-created_at", "-id")[:3]

    latest_vehicles = queryset.order_by(
        "-created_at", "-id"
    )[:9]

    store = StoreConfig.objects.order_by("-updated_at").first()

    store_data = None

    if store:
        store_data = {
            "id": store.id,
            "name": store.name,
            "tagline": store.tagline,
            "logo_url": store.logo_url,
            "hero_image": store.hero_image,
            "store_image": store.store_image,
            "whatsapp": store.whatsapp,
            "phone": store.phone,
            "address": store.address,
            "city": store.city,
            "state": store.state,
            "opening_hours": store.opening_hours,
            "instagram": store.instagram,
            "facebook": store.facebook,
            "about_text": store.about_text,
        }

    return JsonResponse({
        "featured": [
            serialize_vehicle(vehicle)
            for vehicle in featured_vehicles
        ],
        "latest": [
            serialize_vehicle(vehicle)
            for vehicle in latest_vehicles
        ],
        "total": total,
        "store": store_data,
    })


def get_vehicle_detail(request, vehicle_id):
    if request.method != "GET":
        return JsonResponse(
            {"error": "Método não permitido."},
            status=405,
        )

    try:
        vehicle = (
            Vehicle.objects
            .filter(id=vehicle_id, status="available")
            .prefetch_related(
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
            )
            .first()
        )

        if not vehicle:
            return JsonResponse(
                {"error": "Veículo não encontrado."},
                status=404,
            )

        similar_vehicles = (
            Vehicle.objects
            .filter(status="available")
            .exclude(id=vehicle.id)
            .filter(
                Q(brand=vehicle.brand)
                | Q(body_type=vehicle.body_type)
            )
            .order_by("-created_at", "-id")
            .prefetch_related(
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
            )[:3]
        )

        store = StoreConfig.objects.order_by("-updated_at").first()

        store_data = None

        if store:
            store_data = {
                "id": store.id,
                "name": store.name,
                "tagline": store.tagline,
                "logo_url": store.logo_url,
                "hero_image": store.hero_image,
                "store_image": store.store_image,
                "whatsapp": store.whatsapp,
                "phone": store.phone,
                "address": store.address,
                "city": store.city,
                "state": store.state,
                "opening_hours": store.opening_hours,
                "instagram": store.instagram,
                "facebook": store.facebook,
                "about_text": store.about_text,
            }

        return JsonResponse({
            "vehicle": serialize_vehicle(vehicle),
            "similar": [
                serialize_vehicle(item)
                for item in similar_vehicles
            ],
            "store": store_data,
        })

    except (ValueError, TypeError):
        return JsonResponse(
            {"error": "Identificador de veículo inválido."},
            status=400,
        )


@csrf_exempt
def create_lead(request):
    if not _admin_request_allowed(request):
        return JsonResponse(
            {"ok": False, "error": "origin_not_allowed"},
            status=403,
        )

    if request.method != "POST":
        return JsonResponse(
            {"ok": False, "error": "Método não permitido."},
            status=405,
        )
    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"ok": False, "error": "Dados inválidos."},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"ok": False, "error": "Dados inválidos."},
            status=400,
        )

    # Proteção contra spam: se o campo invisível estiver preenchido,
    # simulamos sucesso sem salvar o contato.
    if data.get("website"):
        return JsonResponse({"ok": True})

    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    email = str(data.get("email", "")).strip()
    message = str(data.get("message", "")).strip()
    vehicle_label = str(data.get("vehicle_label", "")).strip()
    vehicle_id = data.get("vehicle_id")

    if not name or len(name) > 120:
        return JsonResponse(
            {"ok": False, "error": "Informe um nome válido."},
            status=400,
        )

    if not phone or len(phone) > 20:
        return JsonResponse(
            {"ok": False, "error": "Informe um telefone válido."},
            status=400,
        )

    phone_digits = "".join(filter(str.isdigit, phone))

    if len(phone_digits) < 10:
        return JsonResponse(
            {"ok": False, "error": "Informe um telefone com DDD."},
            status=400,
        )

    if len(email) > 160:
        return JsonResponse(
            {"ok": False, "error": "E-mail muito longo."},
            status=400,
        )

    if len(vehicle_label) > 180:
        return JsonResponse(
            {"ok": False, "error": "Identificação do veículo muito longa."},
            status=400,
        )

    if len(message) > 5000:
        return JsonResponse(
            {"ok": False, "error": "A mensagem é muito longa."},
            status=400,
        )

    vehicle = None

    if vehicle_id not in (None, ""):
        try:
            vehicle = Vehicle.objects.filter(
                id=int(vehicle_id),
                status="available",
            ).first()
        except (ValueError, TypeError):
            return JsonResponse(
                {"ok": False, "error": "Veículo inválido."},
                status=400,
            )

        if not vehicle:
            return JsonResponse(
                {"ok": False, "error": "Veículo não encontrado."},
                status=400,
            )

    Lead.objects.create(
        vehicle=vehicle,
        vehicle_label=vehicle_label,
        name=name,
        phone=phone,
        email=email,
        message=message or None,
    )

    return JsonResponse({"ok": True}, status=201)