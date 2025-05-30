FROM python:3.11-slim

WORKDIR /app

# Install PostgreSQL client
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# CMD ["flask", "run", "--host=0.0.0.0"]
CMD ["sh", "-c", "uvicorn app.api:app --host 0.0.0.0 --port 8000 & python -m flask --app app run --host 0.0.0.0 --port 5000"]