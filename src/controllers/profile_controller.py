from flask import Blueprint, request, jsonify
from repositories.repository_factory import RepositoryFactory
from models.user_skill import UserSkill
from models.user_activity import UserActivity

profile_bp = Blueprint("profile", __name__, url_prefix="/api/v1/profile")


@profile_bp.route("/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    """Get complete profile data for a user."""
    user_repo = RepositoryFactory.get_repository("user")
    skill_repo = RepositoryFactory.get_repository("user_skill")
    activity_repo = RepositoryFactory.get_repository("user_activity")

    user = user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get user stats
    stats = user_repo.get_user_stats(user_id)

    # Get user skills
    skills = skill_repo.get_by_user_id(user_id)

    # Get user activity log
    activities = activity_repo.get_by_user_id(user_id, limit=10)

    return jsonify({
        "user": user.to_dict(),
        "stats": stats,
        "skills": [s.to_dict() for s in skills],
        "activityLog": [a.to_dict() for a in activities]
    }), 200


@profile_bp.route("/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    """Update user profile information."""
    user_repo = RepositoryFactory.get_repository("user")

    user = user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # Update fields if provided
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'role' in data:
        user.role = data['role']

    try:
        user_repo.update(user)

        # Log the activity
        activity_repo = RepositoryFactory.get_repository("user_activity")
        activity = UserActivity(user_id=user_id, action="Updated profile information")
        activity_repo.create(activity)

        return jsonify({
            "message": "Profile updated successfully",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Skills Endpoints ---

@profile_bp.route("/<int:user_id>/skills", methods=["GET"])
def get_skills(user_id):
    """Get all skills for a user."""
    skill_repo = RepositoryFactory.get_repository("user_skill")
    skills = skill_repo.get_by_user_id(user_id)
    return jsonify([s.to_dict() for s in skills]), 200


@profile_bp.route("/<int:user_id>/skills", methods=["POST"])
def add_skill(user_id):
    """Add a new skill for a user."""
    data = request.get_json()

    skill_name = data.get('name')
    skill_level = data.get('level', 1)

    if not skill_name:
        return jsonify({"error": "Skill name is required"}), 400

    skill_repo = RepositoryFactory.get_repository("user_skill")

    new_skill = UserSkill(
        user_id=user_id,
        skill_name=skill_name,
        skill_level=skill_level
    )

    try:
        skill_id = skill_repo.create(new_skill)

        # Log the activity
        activity_repo = RepositoryFactory.get_repository("user_activity")
        activity = UserActivity(user_id=user_id, action=f"Added skill: {skill_name}")
        activity_repo.create(activity)

        return jsonify({
            "message": "Skill added successfully",
            "skill_id": skill_id,
            "skill": new_skill.to_dict()
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route("/<int:user_id>/skills/<int:skill_id>", methods=["DELETE"])
def delete_skill(user_id, skill_id):
    """Delete a skill."""
    skill_repo = RepositoryFactory.get_repository("user_skill")

    try:
        affected = skill_repo.delete(skill_id)
        if affected == 0:
            return jsonify({"error": "Skill not found"}), 404

        # Log the activity
        activity_repo = RepositoryFactory.get_repository("user_activity")
        activity = UserActivity(user_id=user_id, action="Removed a skill")
        activity_repo.create(activity)

        return jsonify({"message": "Skill deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Activity Log Endpoints ---

@profile_bp.route("/<int:user_id>/activities", methods=["GET"])
def get_activities(user_id):
    """Get activity log for a user."""
    limit = request.args.get('limit', 10, type=int)
    activity_repo = RepositoryFactory.get_repository("user_activity")
    activities = activity_repo.get_by_user_id(user_id, limit=limit)
    return jsonify([a.to_dict() for a in activities]), 200


@profile_bp.route("/<int:user_id>/activities", methods=["POST"])
def add_activity(user_id):
    """Add a new activity log entry."""
    data = request.get_json()

    action = data.get('action')
    if not action:
        return jsonify({"error": "Action is required"}), 400

    activity_repo = RepositoryFactory.get_repository("user_activity")

    new_activity = UserActivity(
        user_id=user_id,
        action=action
    )

    try:
        activity_id = activity_repo.create(new_activity)
        return jsonify({
            "message": "Activity logged successfully",
            "activity_id": activity_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Stats Endpoint ---

@profile_bp.route("/<int:user_id>/stats", methods=["GET"])
def get_stats(user_id):
    """Get performance stats for a user."""
    user_repo = RepositoryFactory.get_repository("user")

    user = user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    stats = user_repo.get_user_stats(user_id)
    return jsonify(stats), 200
