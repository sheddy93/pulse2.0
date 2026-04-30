# Generated manually for storage limits feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0015_pricingconfig_pricingplan_alter_auditlog_action_and_more'),
    ]

    operations = [
        # Add storage fields to PricingPlan
        migrations.AddField(
            model_name='pricingplan',
            name='max_file_size_mb',
            field=models.PositiveIntegerField(default=50, help_text='Dimensione massima file in MB'),
        ),
        migrations.AddField(
            model_name='pricingplan',
            name='max_storage_mb',
            field=models.PositiveIntegerField(default=1000, help_text='Storage massimo in MB'),
        ),
        # Add current_storage_mb to Company
        migrations.AddField(
            model_name='company',
            name='current_storage_mb',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Storage attualmente utilizzato in MB', max_digits=10),
        ),
    ]
