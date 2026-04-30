from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0018_officelocation_is_geofence_enabled_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
    ]
