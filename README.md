# Team Picton

## Setup Instructions
### Backend
1. Install micromamba 
2. Create and activate the environment
```bash
micromamba create -f backend/environment.yml
micromamba activate backend 
```
3. Set up PostgreSQL database:
```bash
CREATE DATABASE picton
```
4. Apply migrations:
```bash
# Lorem Ipsum
```
5. Create superuser:

6. Run developmental server:
```bash
python backend/manage.py runserver
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
<br>
- Diego Coronado - diegoa2992@gmail.com
<br>
- Jihao Ye - jihaoyb@gmail.com
<br>
- Billy Ngo - billykngo@gmail.com
