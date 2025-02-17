#!/bin/bash

python manage.py collectstatic --noinput
python manage.py migrate
gunicorn your_project.wsgi:application --bind=0.0.0.0:8000

# TO CREATE AND APPLY MIGRATIONS
# python manage.py makemigrations
# python manage.py migrate

# CREATE SUPERUSERS
# python manage.py createsuperuser
#
# START BACKEND
# python manage.py runserver 8000
#
# START DB SHELL
# python manage.py dbshell


