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