import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Group
from app.database import SQLALCHEMY_DATABASE_URL

# Create database engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def delete_all_groups():
    """Delete all existing groups from the database."""
    db = SessionLocal()
    try:
        db.query(Group).delete()
        db.commit()
        print("All groups deleted successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error deleting groups: {e}")
    finally:
        db.close()

def fetch_groups():
    """Fetch group data from the USV API."""
    try:
        response = requests.get("https://orar.usv.ro/orar/vizualizare/data/subgrupe.php?json")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching groups: {e}")
        return []

def populate_groups():
    """Populate the groups table with data from the USV API."""
    # First delete all existing groups
    delete_all_groups()

    # Fetch groups from API
    groups_data = fetch_groups()
    if not groups_data:
        print("No groups data fetched from API")
        return

    # Track unique group names
    unique_groups = {}
    for group in groups_data:
        group_name = group.get("groupName")
        if not group_name or not group.get("specializationShortName"):
            continue
        
        # Only keep the first occurrence of each group name
        if group_name not in unique_groups:
            unique_groups[group_name] = group

    # Open a database session
    db = SessionLocal()

    try:
        for group in unique_groups.values():
            # Create a new Group object
            new_group = Group(
                group_nr=group.get("groupName"),
                specialization=group.get("specializationShortName"),
                universitary_year=group.get("studyYear"),
                subgroup=group.get("subgroupIndex"),
                faculty=group.get("facultyId"),
                type=group.get("type")
            )

            # Add to the database session
            db.add(new_group)

        # Commit the transaction
        db.commit()
        print(f"Successfully added {len(unique_groups)} unique groups!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_groups()