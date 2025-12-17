<<<<<<< HEAD
from flask import render_template, session
from services.task_service import TaskService
from services.project_service import ProjectService
from services.notification_service import NotificationService
from flask import jsonify, session
from services.task_service import TaskService

def home():
    user_id = session.get("user_id")

    next_task = TaskService.next_deadline(user_id)
    tasks = TaskService.get_user_tasks(user_id)
    projects = ProjectService.get_user_projects(user_id)
    notifications = NotificationService.get_recent(user_id)

    return render_template(
        "home.html",
        next_task=next_task,
        tasks=tasks,
        projects=projects,
        notifications=notifications
    )
def dashboard_data():
    user_id = session.get("user_id")

    next_task = TaskService.get_next_deadline(user_id)

    deadlines = []
    if next_task:
        deadlines.append({
            "date": next_task.due_date.strftime("%b %d"),
            "description": next_task.title
        })

    return jsonify({
        "deadlines": deadlines
    })
=======
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

>>>>>>> main
