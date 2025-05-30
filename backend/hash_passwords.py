from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User

# Database connection
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sippec_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def add_admin_user():
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == 'admin@admin').first()
        if not admin:
            hashed_password = pwd_context.hash("admin")
            admin = User(
                first_name="Admin",
                last_name="User",
                email="admin@admin",
                password=hashed_password,
                role="admin",
                type="ADMIN"
            )
            db.add(admin)
            db.commit()
            print("Admin user created successfully")
        else:
            print("Admin user already exists")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

def hash_passwords():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            if not user.password.startswith('$2b$'):
                hashed_password = pwd_context.hash(user.password)
                user.password = hashed_password
        db.commit()
        print("Passwords hashed successfully")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_admin_user()
    hash_passwords()