# Generated by Django 5.1.6 on 2025-04-04 00:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_formsubmissionidentifier'),
    ]

    operations = [
        migrations.AddField(
            model_name='formtemplate',
            name='latex_template_path',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
