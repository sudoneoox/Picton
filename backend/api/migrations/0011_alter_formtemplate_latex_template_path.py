# Generated by Django 5.2 on 2025-04-14 23:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_formapproval_decided_at_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='formtemplate',
            name='latex_template_path',
            field=models.CharField(max_length=255),
        ),
    ]
