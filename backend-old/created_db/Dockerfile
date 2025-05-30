FROM postgres:latest
RUN apt-get update && apt-get install -y python3 python3-pip
COPY create_db.py /create_db.py
CMD ["python3", "/create_db.py"]