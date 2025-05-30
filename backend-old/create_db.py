import psycopg2
from psycopg2 import sql
import os
import time

def create_database():
    max_retries = 5
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Connect to PostgreSQL
            conn = psycopg2.connect(
                dbname="postgres",
                user=os.getenv("POSTGRES_USER", "postgres"),
                password=os.getenv("POSTGRES_PASSWORD", "postgres"),
                host=os.getenv("POSTGRES_HOST", "localhost"),
                port=os.getenv("POSTGRES_PORT", "5432")
            )
            conn.autocommit = True
            cursor = conn.cursor()

            # Check if database exists
            cursor.execute("SELECT 1 FROM pg_database WHERE datname='sippec_db'")
            exists = cursor.fetchone()

            if not exists:
                # Create database
                cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier("sippec_db")))
                print("Database 'sippec_db' created successfully.")
            else:
                print("Database 'sippec_db' already exists.")

            cursor.close()
            conn.close()
            return

        except psycopg2.OperationalError as e:
            print(f"Connection attempt {retry_count + 1} failed: {e}")
            retry_count += 1
            if retry_count < max_retries:
                print("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print("Max retries reached. Could not connect to database.")
                raise

if __name__ == "__main__":
    create_database()