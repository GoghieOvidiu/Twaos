from fastapi import Depends, FastAPI
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models import Exam

app = FastAPI()  # Definim instanța FastAPI aici

class ExamCreate(BaseModel):
    subject: str
    date: str
    user_id: int

@app.get("/exams/")
def get_exams(db: Session = Depends(get_db)):
    exams = db.query(Exam).all()
    return [{"id": e.id, "subject": e.subject, "date": e.date} for e in exams]

@app.post("/exams/")
def create_exam(exam: ExamCreate, db: Session = Depends(get_db)):
    db_exam = Exam(subject=exam.subject, date=exam.date, proposed_by=exam.user_id)
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return {"message": "Exam created", "id": db_exam.id}