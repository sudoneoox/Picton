#!/bin/bash

echo "=========================================="
echo "  Django Project Management Script"
echo "=========================================="
echo "Select an option:"
echo "1) Create and apply migrations"
echo "2) Create a superuser"
echo "3) Start the Django development server"
echo "4) Open the database shell"
echo "5) Run Django shell"
echo "6) Collect static files"
echo "7) Check for system checks"
echo "8) Exit"
echo "=========================================="
read -p "Enter your choice: " choice

case $choice in
    1)
        echo "Creating and applying migrations..."
        python manage.py makemigrations
        python manage.py migrate
        ;;
    2)
        echo "Creating a superuser..."
        python manage.py createsuperuser
        ;;
    3)
        echo "Starting the Django development server on port 8000..."
        python manage.py runserver 8000
        ;;
    4)
        echo "Opening the database shell..."
        python manage.py dbshell
        ;;
    5)
        echo "Opening the Django shell..."
        python manage.py shell
        ;;
    6)
        echo "Collecting static files..."
        python manage.py collectstatic --noinput
        ;;
    7)
        echo "Running Django system checks..."
        python manage.py check
        ;;
    8)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option, please select a valid number."
        ;;
esac
