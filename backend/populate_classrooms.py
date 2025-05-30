import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Classroom

# URL to fetch classroom data
CLASSROOMS_URL = "https://orar.usv.ro/orar/vizualizare/data/sali.php?json"

def fetch_classrooms():
    """Fetch classroom data from the URL."""
    response = requests.get(CLASSROOMS_URL)
    response.raise_for_status()  # Raise an error if the request fails
    return response.json()

def populate_classrooms():
    """Populate the classrooms table with data from the URL."""
    # Fetch classroom data
    classrooms_data = fetch_classrooms()

    # Open a database session
    db: Session = SessionLocal()

    try:
        for classroom in classrooms_data:
            # Extract relevant fields (adjust keys based on the JSON structure)
            if(classroom.get("name") == None):
                continue
            name = classroom.get("name")  # Replace "name" with the actual key
            capacity = classroom.get("capacitate")  # Replace "capacity" with the actual key

            # Check if the classroom already exists
            existing_classroom = db.query(Classroom).filter(Classroom.name == name).first()
            if existing_classroom:
                continue  # Skip if the classroom already exists

            # Create a new Classroom object
            new_classroom = Classroom(name=name, capacity=capacity)

            # Add to the database session
            db.add(new_classroom)

        # Commit the transaction
        db.commit()
        print("Classrooms added successfully!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_classrooms()