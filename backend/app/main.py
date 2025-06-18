from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, date, time
from passlib.context import CryptContext
from jose import JWTError, jwt
from . import models, database
import requests
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = FastAPI(title="Sippec API", description="A FastAPI backend for managing users, groups, courses, exams, classrooms, and notifications.")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:30000", "http://127.0.0.1:3000", "http://127.0.0.1:30000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key"  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Pydantic models for request/response
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str
    type: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    type: str

    class Config:
        orm_mode = True

class GroupCreate(BaseModel):
    group_nr: str
    specialization: str
    universitary_year: int
    subgroup: Optional[str] = None
    faculty: Optional[str] = None
    type: Optional[str] = None

class GroupResponse(BaseModel):
    id: int
    group_nr: str
    specialization: str
    universitary_year: int
    subgroup: Optional[str] = None
    faculty: Optional[str] = None
    type: Optional[str] = None

    class Config:
        orm_mode = True

class CourseCreate(BaseModel):
    name: str
    owner_user_id: int
    specialization: str
    universitary_year: int

class CourseResponse(BaseModel):
    id: int
    name: str
    owner_user_id: int
    specialization: str
    universitary_year: int

    class Config:
        orm_mode = True

class ClassroomCreate(BaseModel):
    name: str
    capacity: int

class ClassroomResponse(BaseModel):
    id: int
    name: str
    capacity: int

    class Config:
        orm_mode = True

class ExamScheduleCreate(BaseModel):
    group: str
    discipline: str
    titular: str
    asistent: Optional[str] = None
    data: date
    ora: time
    sala: str
    student_id: int

class ExamScheduleResponse(BaseModel):
    id: int
    group: str
    discipline: str
    titular: str
    asistent: Optional[str] = None
    data: date
    ora: time
    sala: str
    student_id: int

    class Config:
        orm_mode = True

class NotificationCreate(BaseModel):
    sender_user_id: int
    receiver_user_id: int
    message: str
    date: datetime

class NotificationResponse(BaseModel):
    id: int
    sender_user_id: int
    receiver_user_id: int
    message: str
    date: datetime

    class Config:
        orm_mode = True

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "444468629856-hogjqe3aeggukmurso0lfhfpom0p11ks.apps.googleusercontent.com")  # Replace with your actual Google Client ID

class GoogleAuthRequest(BaseModel):
    token: str

# Helper functions for authentication
def verify_password(plain_password, hashed_password):
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@app.post("/login", response_model=Token, summary="User login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    """Authenticate a user and return a JWT token.
    
    Args:
        form_data: Username (email) and password.
        db: Database session.
    
    Returns:
        A JWT token.
    
    Raises:
        HTTPException: If credentials are invalid.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=Token)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(database.get_db)):
    try:
        print(f"Received token: {request.token[:20]}...")  # Print first 20 chars of token
        print(f"Using client ID: {GOOGLE_CLIENT_ID}")
        
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            request.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        
        print(f"Token verified. User info: {idinfo}")
        
        # Get user info from token
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        print(f"Looking for user with email: {email}")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if user:
            print(f"Found existing user: {user.email} (ID: {user.id})")
        else:
            print(f"No existing user found for email: {email}")
            # Create new user
            try:
                user = models.User(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=get_password_hash("google_oauth"),  # Set a random password
                    role="student",  # Default role
                    type="STUDENT"   # Use string instead of enum
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Successfully created new user: {user.email} (ID: {user.id})")
            except Exception as e:
                print(f"Error creating user: {str(e)}")
                db.rollback()
                raise
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        print(f"Error in Google auth: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=401, detail=str(e))

# User endpoints
@app.post("/users/", response_model=UserResponse, summary="Create a new user")
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    """Create a new user in the database.
    
    Args:
        user: User data with first_name, last_name, email, password, role, and type.
        db: Database session.
    
    Returns:
        The created user.
    
    Raises:
        HTTPException: If the email already exists.
    """
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(**user.dict(exclude={"password"}))
    db_user.__setattr__('password', hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[UserResponse], summary="Get all users")
def read_users(db: Session = Depends(database.get_db)):
    """Retrieve all users from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all users.
    """
    return db.query(models.User).all()

@app.put("/users/{user_id}", response_model=UserResponse, summary="Update a user")
def update_user(user_id: int, user: UserCreate, db: Session = Depends(database.get_db)):
    """Update an existing user in the database.
    
    Args:
        user_id: ID of the user to update.
        user: Updated user data.
        db: Database session.
    
    Returns:
        The updated user.
    
    Raises:
        HTTPException: If the user is not found or email is already taken.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db.query(models.User).filter(models.User.email == user.email, models.User.id != user_id).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    for key, value in user.dict(exclude={"password"}).items():
        setattr(db_user, key, value)
    db_user.__setattr__('password', hashed_password)
    db.commit()
    db.refresh(db_user)
    return db_user

# Group endpoints
@app.post("/groups/", response_model=GroupResponse, summary="Create a new group")
def create_group(group: GroupCreate, db: Session = Depends(database.get_db)):
    """Create a new group in the database.
    
    Args:
        group: Group data with group_nr, specialization, and universitary_year.
        db: Database session.
    
    Returns:
        The created group.
    """
    db_group = models.Group(**group.dict())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@app.get("/groups/", response_model=List[GroupResponse], summary="Get all groups")
def read_groups(db: Session = Depends(database.get_db)):
    """Retrieve all groups from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all groups.
    """
    return db.query(models.Group).all()

# New endpoint to get all groups with their group_nr
@app.get("/groups/group_nr", response_model=List[GroupResponse], summary="Get all groups with their group_nr")
def read_groups_group_nr(db: Session = Depends(database.get_db)):
    """Retrieve all groups with their group_nr from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all groups with their group_nr.
    """
    return db.query(models.Group).all()

@app.get("/groups/complete", response_model=List[GroupResponse], summary="Get all groups with complete information")
def read_groups_complete(db: Session = Depends(database.get_db)):
    """Retrieve all groups with complete information including specialization and university year.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all groups with complete information.
    """
    return db.query(models.Group).all()

# Course endpoints
@app.post("/courses/", response_model=CourseResponse, summary="Create a new course")
def create_course(course: CourseCreate, db: Session = Depends(database.get_db)):
    """Create a new course in the database.
    
    Args:
        course: Course data with name, owner_user_id, specialization, and universitary_year.
        db: Database session.
    
    Returns:
        The created course.
    """
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@app.get("/courses/", response_model=List[CourseResponse], summary="Get all courses")
def read_courses(db: Session = Depends(database.get_db)):
    """Retrieve all courses from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all courses.
    """
    return db.query(models.Course).all()

# Classroom endpoints
@app.post("/classrooms/", response_model=ClassroomResponse, summary="Create a new classroom")
def create_classroom(classroom: ClassroomCreate, db: Session = Depends(database.get_db)):
    """Create a new classroom in the database.
    
    Args:
        classroom: Classroom data with name and capacity.
        db: Database session.
    
    Returns:
        The created classroom.
    """
    db_classroom = models.Classroom(**classroom.dict())
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@app.get("/classrooms/", response_model=List[ClassroomResponse], summary="Get all classrooms")
def read_classrooms(db: Session = Depends(database.get_db)):
    """Retrieve all classrooms from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all classrooms.
    """
    return db.query(models.Classroom).all()

# ExamSchedule endpoints
@app.post("/exams_schedule/", response_model=ExamScheduleResponse, summary="Create a new exam schedule")
def create_exam_schedule(
    exam: ExamScheduleCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new exam schedule entry.
    
    Args:
        exam: Exam schedule data.
        db: Database session.
        current_user: The currently authenticated user.
    
    Returns:
        The created exam schedule entry.
    """
    # Create exam with student_id from current user
    exam_data = exam.dict()
    exam_data['student_id'] = current_user.id
    db_exam = models.ExamSchedule(**exam_data)
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam

@app.get("/exams_schedule/", response_model=List[ExamScheduleResponse], summary="Get all exam schedules")
def read_exam_schedules(db: Session = Depends(database.get_db)):
    """Retrieve all exam schedules from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all exam schedules.
    """
    return db.query(models.ExamSchedule).all()

@app.put("/exams_schedule/{exam_id}", response_model=ExamScheduleResponse, summary="Update an exam schedule")
def update_exam_schedule(exam_id: int, exam: ExamScheduleCreate, db: Session = Depends(database.get_db)):
    """Update an existing exam schedule in the database.
    
    Args:
        exam_id: ID of the exam schedule to update.
        exam: Updated exam schedule data.
        db: Database session.
    
    Returns:
        The updated exam schedule.
    
    Raises:
        HTTPException: If the exam schedule is not found.
    """
    db_exam = db.query(models.ExamSchedule).filter(models.ExamSchedule.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam schedule not found")
    for key, value in exam.dict().items():
        setattr(db_exam, key, value)
    db.commit()
    db.refresh(db_exam)
    return db_exam



# Notification endpoints
@app.post("/notifications/", response_model=NotificationResponse, summary="Create a new notification")
def create_notification(notification: NotificationCreate, db: Session = Depends(database.get_db)):
    """Create a new notification in the database.
    
    Args:
        notification: Notification data with sender_user_id, receiver_user_id, message, and date.
        db: Database session.
    
    Returns:
        The created notification.
    """
    db_notification = models.Notification(**notification.dict())
    db_notification.__setattr__('message', notification.message)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@app.get("/notifications/", response_model=List[NotificationResponse], summary="Get all notifications")
def read_notifications(db: Session = Depends(database.get_db)):
    """Retrieve all notifications from the database.
    
    Args:
        db: Database session.
    
    Returns:
        A list of all notifications.
    """
    return db.query(models.Notification).all()

@app.get("/faculties/", response_model=List[str])
def get_faculties(db: Session = Depends(database.get_db)):
    """Get all unique faculty names from Cadre table."""
    faculties = db.query(models.Cadre.facultyName).distinct().all()
    return [faculty[0] for faculty in faculties if faculty[0]]

@app.get("/departments/{faculty_name}", response_model=List[str])
def get_departments(faculty_name: str, db: Session = Depends(database.get_db)):
    """Get all unique department names for a given faculty from Cadre table."""
    departments = db.query(models.Cadre.departmentName).filter(
        models.Cadre.facultyName == faculty_name
    ).distinct().all()
    return [dept[0] for dept in departments if dept[0]]

@app.get("/teachers/{faculty_name}/{department_name}", response_model=List[dict])
def get_teachers(faculty_name: str, department_name: str, db: Session = Depends(database.get_db)):
    """Get all teachers for a given faculty and department from Cadre table."""
    teachers = db.query(models.Cadre).filter(
        models.Cadre.facultyName == faculty_name,
        models.Cadre.departmentName == department_name
    ).all()
    return [
        {
            "id": teacher.id,
            "lastName": teacher.lastName,
            "firstName": teacher.firstName,
            "emailAddress": teacher.emailAddress
        }
        for teacher in teachers
    ]

@app.get("/teacher-courses/{teacher_id}", response_model=List[dict])
def get_teacher_courses(teacher_id: str, db: Session = Depends(database.get_db)):
    """Get all courses for a teacher from USV API."""
    try:
        # Get teacher's id2 from Cadre table
        teacher = db.query(models.Cadre).filter(models.Cadre.id == teacher_id).first()
        if not teacher or not teacher.id2:
            raise HTTPException(status_code=404, detail="Teacher not found or no id2 available")

        # Fetch courses from USV API
        response = requests.get(f"https://orar.usv.ro/orar/vizualizare/data/orarSPG.php?ID={teacher.id2}&mod=prof&json")
        response.raise_for_status()
        data = response.json()
        
        # Extract unique courses from the response
        courses = []
        seen_courses = set()
        
        for activity in data[0]:  # First element contains activities
            course_name = activity.get("topicLongName")
            if course_name and course_name not in seen_courses:
                seen_courses.add(course_name)
                courses.append({
                    "name": course_name
                    #"shortName": activity.get("topicShortName", ""),
                    #"type": activity.get("typeLongName", "")
                })
        
        return courses
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses from USV API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")