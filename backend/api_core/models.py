from django.db import models


class StoreConfig(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=120)
    tagline = models.CharField(max_length=120, default="")
    logo_url = models.CharField(max_length=500, default="")
    hero_image = models.CharField(max_length=500, default="")
    store_image = models.CharField(max_length=500, default="")
    whatsapp = models.CharField(max_length=30, default="")
    phone = models.CharField(max_length=30, default="")
    address = models.CharField(max_length=200, default="")
    city = models.CharField(max_length=80, default="")
    state = models.CharField(max_length=2, default="")
    opening_hours = models.CharField(max_length=300, default="")
    instagram = models.CharField(max_length=200, default="")
    facebook = models.CharField(max_length=300, default="")
    about_text = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "store_config"


class AdminCredential(models.Model):
    id = models.AutoField(primary_key=True)
    password_hash = models.CharField(max_length=64)
    salt = models.CharField(max_length=32)
    iterations = models.PositiveIntegerField(default=100000)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    password_updated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "admin_credential"


class Brand(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=60, unique=True)
    slug = models.CharField(max_length=60, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "brands"
        ordering = ["name"]


class Vehicle(models.Model):
    FUEL_CHOICES = [
        ("Flex", "Flex"),
        ("Gasolina", "Gasolina"),
        ("Álcool", "Álcool"),
        ("Diesel", "Diesel"),
        ("Híbrido", "Híbrido"),
        ("Elétrico", "Elétrico"),
    ]

    TRANSMISSION_CHOICES = [
        ("Manual", "Manual"),
        ("Automático", "Automático"),
        ("Automatizado", "Automatizado"),
        ("CVT", "CVT"),
    ]

    CATEGORY_CHOICES = [
        ("Seminovo", "Seminovo"),
        ("Novo", "Novo"),
        ("Consignado", "Consignado"),
        ("Moto", "Moto"),
    ]

    BODY_TYPE_CHOICES = [
        ("Hatch", "Hatch"),
        ("Sedan", "Sedan"),
        ("SUV", "SUV"),
        ("Picape", "Picape"),
        ("Utilitário", "Utilitário"),
        ("Moto", "Moto"),
        ("Outro", "Outro"),
    ]

    STATUS_CHOICES = [
        ("available", "Disponível"),
        ("paused", "Pausado"),
        ("sold", "Vendido"),
    ]

    id = models.AutoField(primary_key=True)
    brand = models.CharField(max_length=60)
    model = models.CharField(max_length=80)
    version = models.CharField(max_length=120, default="")
    year_manufacture = models.SmallIntegerField(null=True, blank=True)
    year_model = models.SmallIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    mileage = models.PositiveIntegerField(default=0)
    fuel = models.CharField(max_length=10, choices=FUEL_CHOICES, default="Flex")
    transmission = models.CharField(max_length=13, choices=TRANSMISSION_CHOICES, default="Manual")
    color = models.CharField(max_length=40, default="")
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default="Seminovo")
    body_type = models.CharField(max_length=12, choices=BODY_TYPE_CHOICES, default="Hatch")
    doors = models.PositiveSmallIntegerField(null=True, blank=True)
    engine = models.CharField(max_length=60, default="")
    power = models.CharField(max_length=60, default="")
    description = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="available")
    featured = models.BooleanField(default=False)
    is_demo = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "vehicles"
        ordering = ["-created_at"]


class VehicleImage(models.Model):
    id = models.BigAutoField(primary_key=True)
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        db_column="vehicle_id",
        related_name="images",
    )
    image_url = models.CharField(max_length=500)
    position = models.PositiveSmallIntegerField(default=0)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "vehicle_images"
        ordering = ["position", "id"]


class VehicleFeature(models.Model):
    KIND_CHOICES = [
        ("feature", "Opcional"),
        ("equipment", "Equipamento"),
    ]

    id = models.BigAutoField(primary_key=True)
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        db_column="vehicle_id",
        related_name="features",
    )
    kind = models.CharField(max_length=9, choices=KIND_CHOICES, default="feature")
    label = models.CharField(max_length=80)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        managed = False
        db_table = "vehicle_features"
        ordering = ["kind", "position", "id"]


class Lead(models.Model):
    STATUS_CHOICES = [
        ("new", "Novo"),
        ("in_progress", "Em andamento"),
        ("done", "Concluído"),
    ]

    id = models.BigAutoField(primary_key=True)
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        db_column="vehicle_id",
        related_name="leads",
        null=True,
        blank=True,
    )
    vehicle_label = models.CharField(max_length=180, default="")
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=160, default="")
    message = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="new")
    internal_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "leads"
        ordering = ["-created_at"]
