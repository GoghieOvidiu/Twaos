import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.main import get_password_hash
from app.models import UserType
from passlib.context import CryptContext
from app.models import Cadre
import os


# URL to fetch cadre data
CADRE_URL = "https://orar.usv.ro/orar/vizualizare/data/cadre.php?json"

def fetch_cadre():
    """Fetch cadre data from the URL."""
    response = requests.get(CADRE_URL)
    response.raise_for_status()  # Raise an error if the request fails
    return response.json()

def populate_cadre():
    """Populate the cadre table with data from the URL."""
    # Fetch cadre data
    cadre_data = fetch_cadre()

    # Open a database session
    db: Session = SessionLocal()

    try:
        # Delete all existing records
        db.query(Cadre).delete()
        db.commit()

        for cadre in cadre_data:
            # Skip if id is None or empty
            if not cadre.get("id"):
                continue

            # Create a new Cadre object
            new_cadre = Cadre(
                id2=cadre.get("id"),
                lastName=cadre.get("lastName"),
                firstName=cadre.get("firstName"),
                emailAddress=cadre.get("emailAddress"),
                phoneNumber=cadre.get("phoneNumber"),
                facultyName=cadre.get("facultyName"),
                departmentName=cadre.get("departmentName")
            )

            # Add to the database session
            db.add(new_cadre)

        # Commit the transaction
        db.commit()
        print("Cadre table populated successfully!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_cadre()