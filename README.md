# Team Picton
Team Project for COSC 4353 (Software Design)

## Overview
This repository contains a full-stack user management system with role-based access control (RBAC). The backend is built with Django, and the frontend is built with React (and Vite). Authentication is integrated with Office365, and PostgreSQL is used as the primary database.

## Setup Instructions

### Backend
1. Install micromamba (specific to your OS)
_Micromamba is a lightweight Cond-compatible package manager._
```bash
"${SHELL}" <(curl -L micro.mamba.pm/install.sh)
```
2. Create and activate the environment
```bash
# reload your shell configuration so micromamba is recognized
source ~/.bashrc

# create environment from the environment.yml file
micromamba create -n picton-backend -f backend/environment.yml

# activate the new environment
micromamba activate picton-backend 
```
3. Set up PostgreSQL database with pgcli 
```bash
CREATE DATABASE picton;

# Create a user with a password (replace 'your_password' with a secure password)
CREATE USER your_user_name WITH PASSWORD 'your_password';

# Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE picton TO your_user_name;
```
4. Configure a .env file with this format in the root backend directory
```env
# the .env file should have this structure
DEBUG=True
SECRET_KEY=your_django_secret_key
DB_NAME=picton
DB_USER=your_user_name
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# for microsoft authentication
MICROSOFT_GRAPH_KEY = 
MICROSOFT_GRAPH_SECRET = 
MICROSOFT_TENANT_ID=
MICROSOFT_BACKEND_REDIRECT_URL = 
MICROSOFT_FRONTEND_REDIRECT_URL = 
```  
5. Apply migrations:
```python
python backend/manage.py makemigrations
python backend/manage.py migrate
```
6. Create superuser:
```python
python backend/manage.py createsuperuser
```
7. Run developmental server:
```python
python backend/manage.py runserver
```

*. Or if your on a linux machine use the handy in the backend dir to get menu options
```bash
./startupLinux.sh
```

### Frontend 
1. Navigate to the frontend directory and install dependencies
```bash
cd frontend
pnpm install
```
2. Configure a .env file with this format in the root frontend directory
```env
# the backend api server 
VITE_API_BASE_URL=http://localhost:8000/api
# azure redirect url
MICROSOFT_REDIRECT_URL=
# azure registrations id's
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=

DEBUG=true
```

3. Start up developmental environment
```bash
# start frontend server
# NOTE: this also starts tailwindcss & sass live compilers
pnpm run dev
```

## Project Structure
```bash
├── backend/
│   ├── api/  
│   │   ├── migrations/     # defines our database schema 
│   │   ├── urls.py         
│   │   └── views.py         
│   ├── config/
│   │   ├── asgi.py
│   │   ├── settings.py     # Django project settings
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── environment.yml     # micromamba env installation config
│   ├── manage.py           
│   └── requirements.txt

├── frontend/
│   ├── index.html
│   ├── public/             # static images etc.
│   ├── src/
│   │   ├── api.js          # api config and util functions 
│   │   ├── App.jsx         # defines react-router
│   │   ├── main.jsx        
│   │   ├── Components/     # reusable react components
│   │   ├── Pages/          # site pages 
│   │   │   ├── imports.jsx 
│   │   └── styles/
│   │       ├── App.css     # intermediate css to output to tailwind styles
│   │       ├── App.scss    # main config scss styles
│   │       ├── output.css  # tailwindcss output all files will use this 
│   │       ├── modules/    # seperatate component or page styles using scss imports here
```

## Contributors
- Denis Fuentes - denisfuentes@gmail.com
- Diego Coronado - diegoa2992@gmail.com
- Jihao Ye - jihaoyb@gmail.com
- Billy Ngo - billykngo@gmail.com
