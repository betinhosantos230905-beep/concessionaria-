
from getpass import getpass

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from api_core.models import AdminCredential
from api_core.services.admin_auth import (
    PASSWORD_ITERATIONS,
    hash_password,
    random_hex,
)


class Command(BaseCommand):
    help = "Redefine a senha do administrador da loja."

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "RECUPERACAO DA SENHA ADMINISTRATIVA"
            )
        )

        password = getpass("Digite a nova senha: ")
        confirmation = getpass("Confirme a nova senha: ")

        if password != confirmation:
            raise CommandError("As senhas nao conferem.")

        if not 8 <= len(password) <= 200:
            raise CommandError(
                "A senha deve ter entre 8 e 200 caracteres."
            )

        now = timezone.now()
        salt = random_hex()

        password_hash = hash_password(
            password,
            salt,
            PASSWORD_ITERATIONS,
        )

        with transaction.atomic():
            credential = (
                AdminCredential.objects
                .select_for_update()
                .order_by("-updated_at")
                .first()
            )

            if credential is None:
                raise CommandError(
                    "Nenhuma credencial administrativa encontrada."
                )

            credential.password_hash = password_hash
            credential.salt = salt
            credential.iterations = PASSWORD_ITERATIONS
            credential.failed_attempts = 0
            credential.locked_until = None
            credential.password_updated_at = now
            credential.updated_at = now

            credential.save(
                update_fields=[
                    "password_hash",
                    "salt",
                    "iterations",
                    "failed_attempts",
                    "locked_until",
                    "password_updated_at",
                    "updated_at",
                ]
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Senha administrativa redefinida com sucesso!"
            )
        )
