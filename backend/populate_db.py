from populate_groups import populate_groups
from populate_teachers import populate_cadre
from populate_classrooms import populate_classrooms

def populate_database():
    print("Starting database population...")
    
    print("\nPopulating groups...")
    populate_groups()
    
    print("\nPopulating teachers...")
    populate_cadre()
    
    print("\nPopulating classrooms...")
    populate_classrooms()
    
    print("\nDatabase population completed!")

if __name__ == "__main__":
    populate_database() 