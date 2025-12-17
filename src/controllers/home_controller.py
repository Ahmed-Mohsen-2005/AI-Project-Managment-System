from flask import Blueprint, jsonify, request
from services.task_service import TaskService

home_bp = Blueprint("home", __name__, url_prefix="/api/v1/home")
task_service = TaskService()


@home_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """
    Provide dashboard data for the home page calendar widget.
    Returns upcoming tasks ordered by due date.
    """
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", default=5, type=int)

    tasks = task_service.get_upcoming_tasks(user_id=user_id, limit=limit)
    deadlines = [
        {
            "task_id": t.task_id,
            "title": t.title,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "status": t.status.value if hasattr(t.status, "value") else t.status,
            "priority": t.priority.value if hasattr(t.priority, "value") else t.priority,
            "sprint_id": t.sprint_id,
            "assigned_id": t.assigned_id,
        }
        for t in tasks
    ]

    return jsonify({"deadlines": deadlines}), 200

