# Team Picton

## Setup Instructions
### Backend
1. Install micromamba 
```bash
"${SHELL}" <(curl -L micro.mamba.pm/install.sh)
```
2. Create and activate the environment
```bash
micromamba create -f backend/environment.yml
micromamba activate backend 
```
3. Set up PostgreSQL database:
```bash
CREATE DATABASE picton
```
4. Create a .env file in the root of the backend directory
```bash
# with this structure
DEBUG=
SECRET_KEY=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
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
2. Start up developmental server
```bash
pnpm run start
```

## Project Structure
```
backend
├── api/
│   ├── migrations/
├── config/
├── media/
├── static/
└── templates/
├── requirements.txt
├── environment.yml
├── manage.py


frontend/
├── public/
│   ├── assets/
│   │   └── images/
│   └── index.html
├── src/
│   ├── js/
│   │   └── utils/
│   ├── pages/
│   └── styles/
│       ├── modules/
└── package.json
```

### Contributors
- Denis Fuentes - denisfuentes@gmail.com
- Diego Coronado - diegoa2992@gmail.com
- Jihao Ye - jihaoyb@gmail.com
- Billy Ngo - billykngo@gmail.com
