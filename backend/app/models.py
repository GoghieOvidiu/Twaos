from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Date, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class UserType(enum.Enum):
    """Enum for user types."""
    USER = "user"
    STUDENT = "student"
    TEACHER = "teacher"

class User(Base):
    """A user in the system (can be a regular user, student, or teacher)."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Store hashed passwords in production
    role = Column(String, nullable=False)  # e.g., "admin", "staff", "student"
    type = Column(String, nullable=False, default="user")
    owned_courses = relationship("Course", back_populates="owner")
    sent_notifications = relationship("Notification", back_populates="sender", foreign_keys="[Notification.sender_user_id]")
    received_notifications = relationship("Notification", back_populates="receiver", foreign_keys="[Notification.receiver_user_id]")
    exam_schedules = relationship("ExamSchedule", back_populates="student")

class Group(Base):
    """A student group associated with a user, specialization, and university year."""
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    group_nr = Column(String, index=True, nullable=False)
    specialization = Column(String, nullable=False)
    universitary_year = Column(Integer, nullable=False)
    subgroup = Column(String, nullable=True)
    faculty = Column(String, nullable=True)
    type = Column(String, nullable=True)

class Course(Base):
    """A course owned by a user (teacher), tied to a specialization and university year."""
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    specialization = Column(String, nullable=False)
    universitary_year = Column(Integer, nullable=False)
    owner = relationship("User", back_populates="owned_courses")

class Classroom(Base):
    """A classroom with a name, short name, building name, capacity and computers."""
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    short_name = Column(String, index=True, nullable=True)
    building_name = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    computers = Column(Integer, nullable=True, default=0)

class ExamSchedule(Base):
    """An exam schedule entry."""
    __tablename__ = "exams_schedule"
    id = Column(Integer, primary_key=True, index=True)
    group = Column(String, nullable=False)
    discipline = Column(String, nullable=False)
    titular = Column(String, nullable=False)
    asistent = Column(String, nullable=True)
    data = Column(Date, nullable=False)
    ora = Column(Time, nullable=False)
    sala = Column(String, nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student = relationship("User", back_populates="exam_schedules")

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

class Cadre(Base):
    """Un cadru didactic cu informații detaliate."""
    __tablename__ = "cadre"
    id = Column(Integer, primary_key=True, index=True)
    id2 = Column(String, nullable=True)
    lastName = Column(String, nullable=True)
    firstName = Column(String, nullable=True)
    emailAddress = Column(String, nullable=True)
    phoneNumber = Column(String, nullable=True)
    facultyName = Column(String, nullable=True)
    departmentName = Column(String, nullable=True)