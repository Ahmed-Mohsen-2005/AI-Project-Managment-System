from flask import Blueprint, request, jsonify
from repositories.repository_factory import RepositoryFactory
from datetime import date, timedelta

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/v1/dashboard")


@dashboard_bp.route("/projects", methods=["GET"])
def get_all_projects():
    """Get all projects for the project selector."""
    repo = RepositoryFactory.get_repository("project")
    projects = repo.get_all()
    return jsonify([p.to_dict() for p in projects]), 200


@dashboard_bp.route("/project/<int:project_id>", methods=["GET"])
def get_project_dashboard(project_id):
    """Get complete dashboard data for a project."""
    repo = RepositoryFactory.get_repository("project")

    project = repo.get_by_id(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Get project stats
    stats = repo.get_project_stats(project_id)

    # Get critical unassigned tasks
    critical_tasks = repo.get_critical_tasks(project_id)

    # Get recent activities
    activities = repo.get_recent_activities(project_id)

    # Determine project status based on dates
    from datetime import date
    today = date.today()
    if project.end_date and project.end_date < today:
        status = "COMPLETED"
    elif project.start_date and project.start_date > today:
        status = "PLANNING"
    else:
        status = "ACTIVE"

    # Generate AI recommendations based on stats
    recommendations = generate_ai_recommendations(stats, critical_tasks)

    # Calculate stress index (based on workload)
    stress_index = calculate_stress_index(stats)

    return jsonify({
        "project": project.to_dict(),
        "status": status,
        "stats": stats,
        "criticalTasks": critical_tasks,
        "activities": activities,
        "recommendations": recommendations,
        "stressIndex": stress_index["value"],
        "stressDetail": stress_index["detail"]
    }), 200


@dashboard_bp.route("/project/<int:project_id>/stats", methods=["GET"])
def get_project_stats(project_id):
    """Get only stats for a project."""
    repo = RepositoryFactory.get_repository("project")
    stats = repo.get_project_stats(project_id)
    return jsonify(stats), 200


@dashboard_bp.route("/project/<int:project_id>/tasks/critical", methods=["GET"])
def get_critical_tasks(project_id):
    """Get unassigned critical tasks for a project."""
    repo = RepositoryFactory.get_repository("project")
    tasks = repo.get_critical_tasks(project_id)
    return jsonify(tasks), 200


@dashboard_bp.route("/project/<int:project_id>/activities", methods=["GET"])
def get_project_activities(project_id):
    """Get recent activities for a project."""
    limit = request.args.get('limit', 10, type=int)
    repo = RepositoryFactory.get_repository("project")
    activities = repo.get_recent_activities(project_id, limit)
    return jsonify(activities), 200


def generate_ai_recommendations(stats, critical_tasks):
    """Generate AI recommendations based on project stats."""
    recommendations = []

    velocity = float(stats['velocity'].replace('%', ''))
    remaining = stats['tasksRemaining']
    unassigned = stats['unassignedCritical']

    # Check for unassigned critical tasks
    if unassigned > 0:
        recommendations.append({
            "text": f"Assign {unassigned} unassigned critical task(s) to team members.",
            "risk": "high"
        })

    # Check velocity
    if velocity < 50:
        recommendations.append({
            "text": "Velocity is below 50%. Consider reviewing task estimates or adding resources.",
            "risk": "high"
        })
    elif velocity < 75:
        recommendations.append({
            "text": "Velocity is moderate. Monitor progress closely.",
            "risk": "medium"
        })

    # Check remaining tasks
    if remaining > 20:
        recommendations.append({
            "text": f"{remaining} tasks remaining. Consider prioritizing backlog.",
            "risk": "medium"
        })

    # Default recommendation if none
    if not recommendations:
        recommendations.append({
            "text": "Project is on track. No immediate actions required.",
            "risk": "low"
        })

    return recommendations


def calculate_stress_index(stats):
    """Calculate team stress index based on workload."""
    total = stats['totalTasks']
    remaining = stats['tasksRemaining']

    if total == 0:
        return {"value": 0.0, "detail": "No tasks assigned yet."}

    # Stress based on incomplete work ratio
    stress = remaining / total if total > 0 else 0

    if stress > 0.7:
        detail = "Team is highly loaded. Consider redistributing tasks."
    elif stress > 0.4:
        detail = "Team has moderate workload."
    else:
        detail = "Team workload is manageable."

    return {"value": round(stress, 2), "detail": detail}


@dashboard_bp.route("/users", methods=["GET"])
def get_all_users():
    """Get all users for task assignment."""
    repo = RepositoryFactory.get_repository("user")
    users = repo.get_all()
    return jsonify([{"user_id": u.user_id, "name": u.name, "email": u.email} for u in users]), 200


@dashboard_bp.route("/task/<int:task_id>/assign", methods=["PUT"])
def assign_task(task_id):
    """Assign a task to a user."""
    data = request.get_json()
    user_id = data.get("user_id")

    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    task_repo = RepositoryFactory.get_repository("task")
    task = task_repo.get_by_id(task_id)

    if not task:
        return jsonify({"error": "Task not found"}), 404

    task.assigned_id = user_id
    task_repo.update_task(task)

    return jsonify({"message": "Task assigned successfully", "task_id": task_id, "assigned_id": user_id}), 200


@dashboard_bp.route("/project/<int:project_id>/burndown", methods=["GET"])
def get_burndown_data(project_id):
    """Get burndown chart data for the active sprint of a project."""
    sprint_repo = RepositoryFactory.get_repository("sprint")
    task_repo = RepositoryFactory.get_repository("task")

    # Get sprints for the project
    sprints = sprint_repo.get_by_project_id(project_id)

    if not sprints:
        return jsonify({"labels": [], "ideal": [], "actual": [], "sprintName": "No Sprint"}), 200

    # Get the most recent sprint (active sprint)
    active_sprint = sprints[0]

    # Get tasks for the sprint
    tasks = task_repo.get_by_sprint_id(active_sprint.sprint_id)

    # Calculate burndown data
    total_tasks = len(tasks)
    if total_tasks == 0:
        return jsonify({
            "labels": [],
            "ideal": [],
            "actual": [],
            "sprintName": active_sprint.name
        }), 200

    # Calculate sprint duration
    start_date = active_sprint.start_date
    end_date = active_sprint.end_date

    if not start_date or not end_date:
        return jsonify({
            "labels": ["Day 1"],
            "ideal": [total_tasks],
            "actual": [total_tasks],
            "sprintName": active_sprint.name
        }), 200

    # Generate burndown data
    days = (end_date - start_date).days + 1
    labels = []
    ideal = []
    actual = []

    # Calculate ideal burndown (linear)
    daily_burn = total_tasks / days if days > 0 else 0

    # Count completed tasks up to each day
    today = date.today()
    completed_tasks = sum(1 for t in tasks if t.status and t.status.value == 'DONE')

    for i in range(days):
        current_day = start_date + timedelta(days=i)
        labels.append(f"Day {i + 1}")
        ideal.append(round(total_tasks - (daily_burn * (i + 1)), 1))

        # For actual data, show remaining tasks
        if current_day <= today:
            # Simplified: Show current remaining for past/present days
            remaining = total_tasks - completed_tasks
            actual.append(remaining)
        else:
            # Future days have no actual data yet
            actual.append(None)

    return jsonify({
        "labels": labels,
        "ideal": ideal,
        "actual": actual,
        "sprintName": active_sprint.name,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks
    }), 200


@dashboard_bp.route("/project/<int:project_id>/sprints", methods=["GET"])
def get_project_sprints(project_id):
    """Get all sprints for a project."""
    sprint_repo = RepositoryFactory.get_repository("sprint")
    sprints = sprint_repo.get_by_project_id(project_id)

    return jsonify([{
        "sprint_id": s.sprint_id,
        "name": s.name,
        "start_date": s.start_date.isoformat() if s.start_date else None,
        "end_date": s.end_date.isoformat() if s.end_date else None,
        "velocity": s.velocity
    } for s in sprints]), 200
