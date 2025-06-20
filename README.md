# SIPPEC

How to run:
 - run db: docker-compose up -d db
 - check if db runs: docker exec -it sippec-db-1 psql -U postgres -d sippec_db
 - check if db runs: docker exec -it exam-scheduler-main-db-1 psql -U postgres -d sippec_db
 
 - path to Docker: $env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

### Database Setup
1. Start the database:
```bash
docker-compose up -d db
```

2. Apply database migrations:
```bash
cd backend
alembic upgrade head
```

3. Populate the database with initial data:
```bash
python populate_db.py
```

This will:
- Create all necessary tables
- Populate groups from USV API
- Add teachers
- Add classrooms

### Backend Setup
 - python3 -m venv venv
 - source venv/bin/activate
 - pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic sphinx
 - pip freeze > requirements.t
 - CREATE DATABASE sippec_db;
 - alembic revision --autogenerate -m "Create users table"
 - alembic upgrade head #### to apply migrations
 - uvicorn app.main:app --reload      ### http://localhost:8080/docs to see docs
 - uvicorn app.main:app --reload --port 8080