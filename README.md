# Team Picton
Team Project for COSC 4353 (Software Design)

## Setup Instructions
### Backend
1. Install micromamba (specific to your OS)
```bash
"${SHELL}" <(curl -L micro.mamba.pm/install.sh)
```
2. Create and activate the environment
```bash
micromamba create -n picton-backend -f backend/environment.yml
micromamba activate picton-backend 
```
3. Set up PostgreSQL database with pgcli 
```bash
CREATE DATABASE picton

# create a user as well and give them a password

# grant all privileges to the database to that user
```
4. Configure a .env file with this format in the root backend directory
```bash
# the .env file should have this structure
DEBUG=True
SECRET_KEY=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
CORS_ALLOWED_ORIGINS='http://localhost:3000'
```  
5. Apply migrations:
```bash
python manage.py migrate
```
6. Create superuser:
```
python manage.py createsuperuser
```
7. Run developmental server:
```bash
python backend/manage.py runserver
```

### Frontend 
1. Navigate to the frontend directory and install dependencies
```bash
cd frontend && pnpm install 
```
2. Configure a .env file with this format in the root frontend directory
```bash
# the backend api server 
VITE_API_BASE_URL=http://localhost:8000/api
```
3. Start up developmental environment
```bash
# start frontend server
pnpm run dev

# start up tailwindcss 
pnpn run tailwindcss

# start up scss 
pnpm run sass
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

### Contributors
- Denis Fuentes - denisfuentes@gmail.com
- Diego Coronado - diegoa2992@gmail.com
- Jihao Ye - jihaoyb@gmail.com
- Billy Ngo - billykngo@gmail.com
