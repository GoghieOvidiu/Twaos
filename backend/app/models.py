from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class UserType(enum.Enum):
    """Enum for user types."""
    USER = "user"
    STUDENT = "student"
    TEACHER = "teacher"

class ExamStatus(enum.Enum):
    """Enum for exam status."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    """A user in the system (can be a regular user, student, or teacher)."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Store hashed passwords in production
    role = Column(String, nullable=False)  # e.g., "admin", "staff", "student"
    type = Column(Enum(UserType), nullable=False, default=UserType.USER)
    groups = relationship("Group", back_populates="user")
    exams = relationship("ExamSchedule", back_populates="user", foreign_keys="[ExamSchedule.user_id]")
    assisted_exams = relationship("ExamSchedule", back_populates="assistant_user", foreign_keys="[ExamSchedule.assistant_user_id]")
    owned_courses = relationship("Course", back_populates="owner")
    sent_notifications = relationship("Notification", back_populates="sender", foreign_keys="[Notification.sender_user_id]")
    received_notifications = relationship("Notification", back_populates="receiver", foreign_keys="[Notification.receiver_user_id]")

class Group(Base):
    """A student group associated with a user, specialization, and university year."""
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    group_nr = Column(String, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    specialization = Column(String, nullable=False)
    universitary_year = Column(Integer, nullable=False)
    user = relationship("User", back_populates="groups")
    exams = relationship("ExamSchedule", back_populates="group")

class Course(Base):
    """A course owned by a user (teacher), tied to a specialization and university year."""
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    specialization = Column(String, nullable=False)
    universitary_year = Column(Integer, nullable=False)
    owner = relationship("User", back_populates="owned_courses")
    exams = relationship("ExamSchedule", back_populates="course")

class Classroom(Base):
    """A classroom with a name and capacity."""
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    exams = relationship("ExamSchedule", back_populates="classroom")

class ExamSchedule(Base):
    """A scheduled exam for a course, group, and classroom."""
    __tablename__ = "exams_schedule"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(Enum(ExamStatus), nullable=False, default=ExamStatus.PENDING)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assistant_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    course = relationship("Course", back_populates="exams")
    group = relationship("Group", back_populates="exams")
    user = relationship("User", back_populates="exams", foreign_keys=[user_id])
    assistant_user = relationship("User", back_populates="assisted_exams", foreign_keys=[assistant_user_id])
    classroom = relationship("Classroom", back_populates="exams")

class Notification(Base):
    """A notification sent from one user to another."""
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    sender_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    sender = relationship("User", back_populates="sent_notifications", foreign_keys=[sender_user_id])
    receiver = relationship("User", back_populates="received_notifications", foreign_keys=[receiver_user_id])