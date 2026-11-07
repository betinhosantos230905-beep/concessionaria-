
from django.urls import path

from .views import (
    health_check,
    get_store,
    get_vehicles,
    get_catalog_facets,
    get_home_data,
    get_vehicle_detail,
    create_lead,
)

from .admin_auth_views import (
    admin_status,
    admin_setup,
    admin_login,
    admin_logout,
)

from .admin_vehicle_views import (
    admin_save_vehicle,
    admin_list_vehicles,
    admin_vehicle_detail,
    admin_quick_update_vehicle,
    admin_dashboard,
)

from .admin_upload_views import (
    admin_upload_image,
)

from .admin_lead_views import (
    admin_list_leads,
    admin_update_lead,
)

urlpatterns = [
    # API pública
    path("health/", health_check, name="health-check"),
    path("store/", get_store, name="get-store"),
    path("home/", get_home_data, name="get-home-data"),
    path("vehicles/", get_vehicles, name="get-vehicles"),
    path("vehicles/facets/", get_catalog_facets, name="get-catalog-facets"),
    path("vehicles/<int:vehicle_id>/", get_vehicle_detail, name="get-vehicle-detail"),
    path("leads/", create_lead, name="create-lead"),

    # Autenticação administrativa
    path("admin/status/", admin_status, name="admin-status"),
    path("admin/setup/", admin_setup, name="admin-setup"),
    path("admin/login/", admin_login, name="admin-login"),
    path("admin/logout/", admin_logout, name="admin-logout"),

    # Upload de imagens para o Cloudinary
    path(
        "admin/upload-image/",
        admin_upload_image,
        name="admin-upload-image",
    ),

    # Administração de veículos
    path("admin/vehicles/", admin_save_vehicle, name="admin-save-vehicle"),
    path("admin/vehicles/list/", admin_list_vehicles, name="admin-list-vehicles"),
    path("admin/dashboard/", admin_dashboard, name="admin-dashboard"),
    # Administração de interessados
    path("admin/leads/", admin_list_leads, name="admin-list-leads"),
    path(
        "admin/leads/<int:lead_id>/",
        admin_update_lead,
        name="admin-update-lead",
    ),
    # Edição, consulta e exclusão
    path(
        "admin/vehicles/<int:vehicle_id>/",
        admin_vehicle_detail,
        name="admin-vehicle-detail",
    ),

    # Atualização rápida
    path(
        "admin/vehicles/<int:vehicle_id>/quick/",
        admin_quick_update_vehicle,
        name="admin-quick-update-vehicle",
    ),
]
