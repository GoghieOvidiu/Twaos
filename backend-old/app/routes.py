from flask import jsonify, request
from sqlalchemy.orm import Session

from .database import get_db
from .models import Exam, User


def init_routes(app):
    @app.route("/users", methods=["GET"])
    def get_users():
        db = next(get_db())
        users = db.query(User).all()
        return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users])

    @app.route("/exams", methods=["POST"])
    def propose_exam():
        db = next(get_db())
        data = request.json
        exam = Exam(subject=data["subject"], date=data["date"], proposed_by=data["user_id"])
        db.add(exam)
        db.commit()
        return jsonify({"message": "Exam proposed", "id": exam.id}), 201