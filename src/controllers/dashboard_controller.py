from flask import Blueprint, request, jsonify
from repositories.repository_factory import RepositoryFactory

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
