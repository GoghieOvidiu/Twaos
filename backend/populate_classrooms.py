import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Classroom, ExamSchedule, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# URL to fetch classroom data
CLASSROOMS_URL = "https://orar.usv.ro/orar/vizualizare/data/sali.php?json"

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/sippec_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fetch_classrooms():
    """Fetch classroom data from the URL."""
    response = requests.get(CLASSROOMS_URL)
    response.raise_for_status()  # Raise an error if the request fails
    return response.json()

def populate_classrooms():
    """Delete all classrooms and repopulate the table with data from the URL."""
    # Fetch classroom data
    classrooms_data = fetch_classrooms()

    # Open a database session
    db: Session = SessionLocal()

    try:
        # Delete all existing classrooms
        db.query(Classroom).delete()
        db.commit()

        for classroom in classrooms_data:
            # Skip if name is None or empty
            if not classroom.get("name"):
                continue
            # Extract and convert fields
            name = classroom.get("name")
            short_name = classroom.get("shortName")
            building_name = classroom.get("buildingName")
            try:
                capacity = int(classroom.get("capacitate") or 0)
            except Exception:
                capacity = 0
            try:
                computers = int(classroom.get("computers") or 0)
            except Exception:
                computers = 0

            # Create a new Classroom object
            new_classroom = Classroom(
                name=name,
                short_name=short_name,
                building_name=building_name,
                capacity=capacity,
                computers=computers
            )

            # Add to the database session
            db.add(new_classroom)

        # Commit the transaction
        db.commit()
        print("Classrooms table repopulated successfully!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

def delete_all_classrooms():
    db = SessionLocal()
    try:
        # First delete all exam schedules that reference classrooms
        db.query(ExamSchedule).delete()
        db.commit()
        
        # Then delete all classrooms
        db.query(Classroom).delete()
        db.commit()
        print("Successfully deleted all classrooms and their associated exam schedules")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_classrooms()
    populate_classrooms()