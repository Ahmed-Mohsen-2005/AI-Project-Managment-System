from flask import Blueprint, jsonify, request
from models.time import TimeTracking
from services.time_service import TimeTrackingService
from datetime import datetime, date


time_bp = Blueprint("time_tracking", __name__, url_prefix="/api/v1/time")


time_service = TimeTrackingService()



# ====================================
# Get all time entries
# ====================================
@time_bp.route("", methods=["GET"])
@time_bp.route("/", methods=["GET"])
def list_all_time_entries():
    """Get all time tracking entries"""
    entries = time_service.get_all_entries()
    return jsonify([entry.to_dict() for entry in entries]), 200



# ====================================
# Get time entry by ID
# ====================================
@time_bp.route("/<int:time_id>", methods=["GET"])
def get_time_entry(time_id):
    """Get a specific time entry by ID"""
    try:
        entry = time_service.get_entry_by_id(time_id)
        return jsonify(entry.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404



# ====================================
# Get time entries by user
# ====================================
@time_bp.route("/user/<int:user_id>", methods=["GET"])
def get_time_by_user(user_id):
    """Get all time entries for a specific user"""
    entries = time_service.get_entries_by_user(user_id)
    return jsonify([entry.to_dict() for entry in entries]), 200



# ====================================
# Get time entries by project
# ====================================
@time_bp.route("/project/<int:project_id>", methods=["GET"])
def get_time_by_project(project_id):
    """Get all time entries for a specific project"""
    entries = time_service.get_entries_by_project(project_id)
    return jsonify([entry.to_dict() for entry in entries]), 200



# ====================================
# Get time entries by task
# ====================================
@time_bp.route("/task/<int:task_id>", methods=["GET"])
def get_time_by_task(task_id):
    """Get all time entries for a specific task"""
    entries = time_service.get_entries_by_task(task_id)
    return jsonify([entry.to_dict() for entry in entries]), 200



# ====================================
# Get time entries by date range
# ====================================
@time_bp.route("/range", methods=["GET"])
def get_time_by_date_range():
    """
    Get time entries within a date range
    Query params: start_date, end_date, user_id (optional)
    Example: /api/v1/time/range?start_date=2025-12-01&end_date=2025-12-31&user_id=1
    """
    try:
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        user_id = request.args.get("user_id", type=int)

        if not start_date_str or not end_date_str:
            return jsonify({"error": "start_date and end_date are required"}), 400

        # Parse dates
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        entries = time_service.get_entries_by_date_range(start_date, end_date, user_id)
        return jsonify([entry.to_dict() for entry in entries]), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid date format. Use YYYY-MM-DD: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500



# ====================================
# Get today's time entries for a user
# ====================================
@time_bp.route("/today/<int:user_id>", methods=["GET"])
def get_today_time_by_user(user_id):
    """Get today's time entries for a specific user"""
    entries = time_service.get_today_entries_by_user(user_id)
    return jsonify([entry.to_dict() for entry in entries]), 200



# ====================================
# Get total hours by project
# ====================================
@time_bp.route("/total/project/<int:project_id>", methods=["GET"])
def get_total_hours_by_project(project_id):
    """Get total hours logged for a specific project"""
    total_hours = time_service.get_total_hours_by_project(project_id)
    return jsonify({
        "project_id": project_id,
        "total_hours": float(total_hours)
    }), 200



# ====================================
# Get total hours by task
# ====================================
@time_bp.route("/total/task/<int:task_id>", methods=["GET"])
def get_total_hours_by_task(task_id):
    """Get total hours logged for a specific task"""
    total_hours = time_service.get_total_hours_by_task(task_id)
    return jsonify({
        "task_id": task_id,
        "total_hours": float(total_hours)
    }), 200



# ====================================
# Get total hours by user
# ====================================
@time_bp.route("/total/user/<int:user_id>", methods=["GET"])
def get_total_hours_by_user(user_id):
    """
    Get total hours logged by a user
    Optional query params: start_date, end_date
    """
    try:
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        start_date = None
        end_date = None

        if start_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        if end_date_str:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        total_hours = time_service.get_total_hours_by_user(user_id, start_date, end_date)
        
        response = {
            "user_id": user_id,
            "total_hours": float(total_hours)
        }
        
        if start_date:
            response["start_date"] = start_date.isoformat()
        if end_date:
            response["end_date"] = end_date.isoformat()

        return jsonify(response), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid date format. Use YYYY-MM-DD: {str(e)}"}), 400



# ====================================
# Create new time entry
# ====================================
@time_bp.route("", methods=["POST"])
@time_bp.route("/", methods=["POST"])
def create_time_entry():
    """Create a new time tracking entry"""
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400

        data = request.json
        print(f"[DEBUG] Received time entry data: {data}")

        # Validate required fields
        if not data.get("user_id"):
            return jsonify({"error": "user_id is required"}), 400
        if not data.get("project_id"):
            return jsonify({"error": "project_id is required"}), 400
        if not data.get("date_worked"):
            return jsonify({"error": "date_worked is required"}), 400

        # Either duration or start/end times must be provided
        has_times = data.get("start_time") and data.get("end_time")
        has_duration = data.get("duration_hours")
        
        if not has_times and not has_duration:
            return jsonify({
                "error": "Either (start_time and end_time) or duration_hours is required"
            }), 400

        try:
            time_entry = TimeTracking(**data)
            print("[DEBUG] TimeTracking object created successfully")
            
            # Auto-calculate duration if times are provided but duration is not
            if has_times and not has_duration:
                time_entry.calculate_duration()
            
            # Validate the entry
            if not time_entry.is_valid():
                return jsonify({"error": "Invalid time entry data"}), 400

        except ValueError as e:
            return jsonify({"error": f"Invalid data: {str(e)}"}), 400

        try:
            entry_id = time_service.create_entry(time_entry)
            return jsonify({
                "id": entry_id,
                "message": "Time entry created successfully"
            }), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500



# ====================================
# Update time entry
# ====================================
@time_bp.route("/<int:time_id>", methods=["PUT"])
def update_time_entry(time_id):
    """Update an existing time entry"""
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400

        data = request.json
        print(f"[DEBUG] Updating time entry {time_id} with data: {data}")

        # Validate required fields
        if not data.get("user_id"):
            return jsonify({"error": "user_id is required"}), 400
        if not data.get("project_id"):
            return jsonify({"error": "project_id is required"}), 400
        if not data.get("date_worked"):
            return jsonify({"error": "date_worked is required"}), 400

        try:
            time_entry = TimeTracking(**data)
            
            # Auto-calculate duration if times are provided
            if time_entry.start_time and time_entry.end_time:
                time_entry.calculate_duration()
            
            # Validate the entry
            if not time_entry.is_valid():
                return jsonify({"error": "Invalid time entry data"}), 400

        except ValueError as e:
            return jsonify({"error": f"Invalid data: {str(e)}"}), 400

        try:
            time_service.update_entry(time_id, time_entry)
            return jsonify({"message": "Time entry updated successfully"}), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500



# ====================================
# Delete time entry
# ====================================
@time_bp.route("/<int:time_id>", methods=["DELETE"])
def delete_time_entry(time_id):
    """Delete a time tracking entry"""
    try:
        time_service.delete_entry(time_id)
        return jsonify({"message": "Time entry deleted successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
