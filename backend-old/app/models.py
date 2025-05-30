from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class ExamStatus(enum.Enum):
    PENDING = "pending"
    REJECTED = "rejected"
    APPROVED = "approved"
    DONE = "done"

class Faculty(Base):
    __tablename__ = "faculties"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    specializations = relationship("Specialization", back_populates="faculty")

class Specialization(Base):
    __tablename__ = "specializations"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    faculty_id = Column(Integer, ForeignKey("business.faculties.id"))
    degree_type = Column(String)  # "bachelor" or "master"
    faculty = relationship("Faculty", back_populates="specializations")
    groups = relationship("Group", back_populates="specialization")

class Course(Base):
    __tablename__ = "courses"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialization_id = Column(Integer, ForeignKey("business.specializations.id"))
    teacher_id = Column(Integer, ForeignKey("business.teachers.id"))
    specialization = relationship("Specialization")
    teacher = relationship("Teacher")
    groups = relationship("Group", secondary="business.course_groups")

class Group(Base):
    __tablename__ = "groups"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    year = Column(Integer)
    specialization_id = Column(Integer, ForeignKey("business.specializations.id"))
    specialization = relationship("Specialization", back_populates="groups")
    students = relationship("Student", back_populates="group")
    courses = relationship("Course", secondary="business.course_groups")

class CourseGroup(Base):
    __tablename__ = "course_groups"
    __table_args__ = {"schema": "business"}
    course_id = Column(Integer, ForeignKey("business.courses.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("business.groups.id"), primary_key=True)

class Student(Base):
    __tablename__ = "students"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    group_id = Column(Integer, ForeignKey("business.groups.id"))
    is_leader = Column(Boolean, default=False)
    group = relationship("Group", back_populates="students")
    exam_requests = relationship("Exam", back_populates="requested_by")

class Teacher(Base):
    __tablename__ = "teachers"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    courses = relationship("Course", back_populates="teacher")
    exam_approvals = relationship("Exam", back_populates="exam_approvals")

class Exam(Base):
    __tablename__ = "exams"
    __table_args__ = {"schema": "business"}
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("business.courses.id"))
    group_id = Column(Integer, ForeignKey("business.groups.id"))
    requested_by_id = Column(Integer, ForeignKey("business.students.id"))
    approved_by_id = Column(Integer, ForeignKey("business.teachers.id"), nullable=True)
    proposed_date = Column(DateTime)
    status = Column(Enum(ExamStatus), default=ExamStatus.PENDING)
    course = relationship("Course")
    group = relationship("Group")
    requested_by = relationship("Student", back_populates="exam_requests")
    approved_by = relationship("Teacher", back_populates="exam_approvals")