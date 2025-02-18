#!/bin/bash

python manage.py collectstatic --noinput
python manage.py migrate
gunicorn your_project.wsgi:application --bind=0.0.0.0:8000


