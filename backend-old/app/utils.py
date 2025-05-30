import pandas as pd

from .database import get_db
from .models import Exam


def export_to_excel():
    db = next(get_db())
    exams = db.query(Exam).all()
    data = [{"Subject": e.subject, "Date": e.date} for e in exams]
    df = pd.DataFrame(data)
    df.to_excel("exam_schedule.xlsx", index=False)
    return "exam_schedule.xlsx"