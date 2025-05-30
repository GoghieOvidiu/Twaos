import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.main import get_password_hash
from app.models import UserType
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash2(password: str) -> str:
    return pwd_context.hash(password)

# URL to fetch teacher data
TEACHERS_URL = "https://orar.usv.ro/orar/vizualizare/data/cadre.php?json"

def fetch_teachers():
    """Fetch teacher data from the URL."""
    response = requests.get(TEACHERS_URL)
    response.raise_for_status()  # Raise an error if the request fails
    return response.json()

def populate_teachers():
    """Populate the users table with teacher data from the URL."""
    # Fetch teacher data
    teachers_data = fetch_teachers()

    # Open a database session
    db: Session = SessionLocal()

    try:
        for teacher in teachers_data:
            
            if(teacher.get("firstName") == None):
                continue
            if(teacher.get("lastName") == None):
                continue
            # Extract relevant fields (adjust keys based on the JSON structure)
            
            first_name = teacher.get("firstName")
            last_name = teacher.get("lastName")
            email = teacher.get("emailAddress") # Generate email if missing
            password = "teacher"  # Set a default password for all teachers

            # Check if the teacher already exists
           # existing_user = db.query(User).filter(User.email == email).first()
            #if existing_user:
             #   continue  # Skip if the teacher already exists

            # Create a new User object
            hashed_password = get_password_hash(password)
            new_user = User(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password=hashed_password,
                role="teacher",
                type=UserType.TEACHER
            )

            # Add to the database session
            db.add(new_user)

        # Commit the transaction
        db.commit()
        print("Teachers added successfully!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_teachers()