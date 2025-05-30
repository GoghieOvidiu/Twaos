from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from . import models, database

app = FastAPI(title="Sippec API", description="A FastAPI backend for managing users, groups, courses, exams, classrooms, and notifications.")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    user_id: int
    specialization: str
    universitary_year: int

class GroupResponse(BaseModel):
    id: int
    group_nr: str
    user_id: int
    specialization: str
    universitary_year: int

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
    course_id: int
    group_id: int
    date: datetime
    status: str
    user_id: int
    assistant_user_id: Optional[int]
    classroom_id: int

class ExamScheduleResponse(BaseModel):
    id: int
    course_id: int
    group_id: int
    date: datetime
    status: str
    user_id: int
    assistant_user_id: Optional[int]
    classroom_id: int

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
    db_user = models.User(**user.dict(exclude={"password"}), password=hashed_password)
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
    db_user.password = hashed_password
    db.commit()
    db.refresh(db_user)
    return db_user

# Group endpoints
@app.post("/groups/", response_model=GroupResponse, summary="Create a new group")
def create_group(group: GroupCreate, db: Session = Depends(database.get_db)):
    """Create a new group in the database.
    
    Args:
        group: Group data with group_nr, user_id, specialization, and universitary_year.
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
def create_exam_schedule(exam: ExamScheduleCreate, db: Session = Depends(database.get_db)):
    """Create a new exam schedule in the database.
    
    Args:
        exam: Exam schedule data with course_id, group_id, date, status, user_id, assistant_user_id, and classroom_id.
        db: Database session.
    
    Returns:
        The created exam schedule.
    """
    db_exam = models.ExamSchedule(**exam.dict())
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