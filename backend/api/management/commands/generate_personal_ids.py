from django.core.management.base import BaseCommand
from django.db.models import Q
from api.models import User
import random


class Command(BaseCommand):
    help = "Generate personal IDs for users who do not have one"

    def handle(self, *args, **options):
        # Get all users without a personal_id
        users_without_id = User.objects.filter(
            Q(personal_id__isnull=True) | Q(personal_id="")
        )

        count = users_without_id.count()
        self.stdout.write(f"Found {count} users without a personal ID")

        for user in users_without_id:
            # Generate a unique 7-digit ID
            while True:
                personal_id = str(random.randint(1000000, 9999999))
                if not User.objects.filter(personal_id=personal_id).exists():
                    break

            user.personal_id = personal_id
            user.save()
            self.stdout.write(f"Generated ID {personal_id} for user {user.username}")

        self.stdout.write(
            self.style.SUCCESS(f"Successfully generated personal IDs for {count} users")
        )
