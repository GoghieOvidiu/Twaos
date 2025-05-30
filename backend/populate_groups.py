import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Group

# URL to fetch group data
GROUPS_URL = "https://orar.usv.ro/orar/vizualizare/data/subgrupe.php?json"

def fetch_groups():
    """Fetch group data from the URL."""
    response = requests.get(GROUPS_URL)
    response.raise_for_status()  # Raise an error if the request fails
    return response.json()

def populate_groups():
    """Populate the groups table with data from the URL."""
    # Fetch group data
    groups_data = fetch_groups()

    # Open a database session
    db: Session = SessionLocal()

    try:
        for group in groups_data:
            
            if(group.get("groupName") == None):
                continue
            # Extract relevant fields (adjust keys based on the JSON structure)
            group_name = group.get("groupName")  # Replace "name" with the actual key for the group name
            specialization = group.get("specializationShortName")  # Replace with the actual key
            year = group.get("studyYear")  # Replace with the actual key

            # Check if the group already exists
            existing_group = db.query(Group).filter(Group.group_nr == group_name).first()
            if existing_group:
                continue  # Skip if the group already exists

            # Create a new Group object
            new_group = Group(
                group_nr=group_name,
                user_id=1,  # Assuming a default user ID, adjust as necessary
                specialization=specialization,
                universitary_year=year
            )

            # Add to the database session
            db.add(new_group)

        # Commit the transaction
        db.commit()
        print("Groups added successfully!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_groups()