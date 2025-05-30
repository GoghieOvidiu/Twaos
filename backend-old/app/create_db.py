import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.models import Base, Faculty, Specialization, Course, Group, Student, Teacher

# Debugging
print("Current directory:", os.getcwd())
print("Python path:", sys.path)
print("Attempting to import app.models")

def create_db():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/sippec_db")
    engine = create_engine(DATABASE_URL)
    
    # Create tables
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()

    # Check if tables are empty
    inspector = inspect(engine)
    tables_to_check = ["faculties", "specializations", "courses", "groups"]
    is_empty = any(
        not inspector.has_table(table, schema="business") or 
        session.query(globals()[table.capitalize()]).count() == 0 
        for table in tables_to_check
    )

    if is_empty:
        print("Populating database with initial data...")
        eng_faculty = Faculty(name="Faculty of Engineering")
        session.add(eng_faculty)
        session.flush()

        cs_spec = Specialization(name="Computer Science", faculty_id=eng_faculty.id, degree_type="bachelor")
        ai_spec = Specialization(name="Artificial Intelligence", faculty_id=eng_faculty.id, degree_type="master")
        session.add_all([cs_spec, ai_spec])
        session.flush()

        cs_group1 = Group(name="CS-Year1-GroupA", year=1, specialization_id=cs_spec.id)
        cs_group2 = Group(name="CS-Year2-GroupB", year=2, specialization_id=cs_spec.id)
        ai_group1 = Group(name="AI-Year1-GroupA", year=1, specialization_id=ai_spec.id)
        session.add_all([cs_group1, cs_group2, ai_group1])
        session.flush()

        student1 = Student(name="John Doe", group_id=cs_group1.id, is_leader=True)
        student2 = Student(name="Jane Smith", group_id=cs_group1.id)
        student3 = Student(name="Alice Brown", group_id=ai_group1.id, is_leader=True)
        session.add_all([student1, student2, student3])
        session.flush()

        teacher1 = Teacher(name="Dr. Smith")
        teacher2 = Teacher(name="Dr. Johnson")
        session.add_all([teacher1, teacher2])
        session.flush()

        course1 = Course(name="Algorithms", specialization_id=cs_spec.id, teacher_id=teacher1.id)
        course2 = Course(name="Machine Learning", specialization_id=ai_spec.id, teacher_id=teacher2.id)
        session.add_all([course1, course2])
        session.flush()

        session.execute(
            "INSERT INTO business.course_groups (course_id, group_id) VALUES (:course_id, :group_id)",
            [
                {"course_id": course1.id, "group_id": cs_group1.id},
                {"course_id": course2.id, "group_id": ai_group1.id}
            ]
        )

        session.commit()
        print("Database populated successfully.")
    else:
        print("Database already contains data, skipping initialization.")
    session.close()

if __name__ == "__main__":
    create_db()