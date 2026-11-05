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

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("store/", get_store, name="get-store"),
    path("home/", get_home_data, name="get-home-data"),
    path("vehicles/", get_vehicles, name="get-vehicles"),
    path("vehicles/facets/", get_catalog_facets, name="get-catalog-facets"),
    path("admin/status/", admin_status, name="admin-status"),
    path("admin/setup/", admin_setup, name="admin-setup"),
    path("admin/login/", admin_login, name="admin-login"),
    path("admin/logout/", admin_logout, name="admin-logout"),
    path("vehicles/<int:vehicle_id>/", get_vehicle_detail, name="get-vehicle-detail"),
    path("leads/", create_lead, name="create-lead"),
]