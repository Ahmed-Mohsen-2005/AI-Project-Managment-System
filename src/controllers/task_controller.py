from flask import Blueprint, render_template, abort, jsonify, request
from models.task import Task
from services.task_service import TaskService

task_bp = Blueprint("task", __name__, url_prefix="/api/v1/tasks")

task_service = TaskService()


@task_bp.route("", methods=["GET"])
@task_bp.route("/", methods=["GET"])
def list_all_tasks():
    tasks = task_service.get_all_tasks()
    return jsonify([t.to_dict() for t in tasks]), 200


@task_bp.route("/<int:task_id>", methods=["GET"])
def get_task(task_id):
    try:
        task = task_service.get_task_by_id(task_id)
        return jsonify(task.to_dict()), 200
    except ValueError:
        abort(404)


@task_bp.route("", methods=["POST"])
@task_bp.route("/", methods=["POST"])
def create_task():
    try:
        if not request.is_json:
            return jsonify({"error": "JSON body required"}), 400

        data = request.json
        
        # Log incoming data for debugging
        print(f"[DEBUG] Received task data: {data}")
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({"error": "Task title is required"}), 400
        
        if not data.get('sprint_id'):
            return jsonify({"error": "Sprint ID is required"}), 400
        
        # Set created_by from session or use assigned_id as fallback
        if 'created_by' not in data:
            data['created_by'] = data.get('assigned_id', 1)
        
        # Set default values for optional fields if not provided
        if 'status' not in data:
            data['status'] = 'TODO'
        if 'priority' not in data:
            data['priority'] = 'MEDIUM'
        if 'estimate_hours' not in data:
            data['estimate_hours'] = None
        if 'due_date' not in data:
            data['due_date'] = None
        if 'assigned_id' not in data:
            data['assigned_id'] = None
        
        print(f"[DEBUG] Creating task with data: {data}")
        
        try:
            task = Task(**data)
            print(f"[DEBUG] Task object created successfully")
        except ValueError as e:
            print(f"[ERROR] Task validation failed: {str(e)}")
            return jsonify({"error": f"Invalid data: {str(e)}"}), 400
        except Exception as e:
            print(f"[ERROR] Unexpected error creating Task object: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Error creating task object: {str(e)}"}), 400

        try:
            task_id = task_service.create_task(task)
            print(f"[DEBUG] Task created successfully with ID: {task_id}")
            return jsonify({"task_id": task_id, "message": "Task created successfully"}), 201
        except ValueError as e:
            print(f"[ERROR] Service validation failed: {str(e)}")
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            print(f"[ERROR] Unexpected error in service: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Database error: {str(e)}"}), 500
            
    except Exception as e:
        print(f"[ERROR] Unexpected error in create_task endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@task_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    if not request.is_json:
        return jsonify({"error": "JSON body required"}), 400

    data = request.json
    
    # Get existing task first
    try:
        existing_task = task_service.get_task_by_id(task_id)
    except ValueError:
        return jsonify({"error": f"Task with ID {task_id} not found"}), 404
    
    # Merge with existing data (only update provided fields)
    task_data = {
        'task_id': task_id,
        'sprint_id': data.get('sprint_id', existing_task.sprint_id),
        'title': data.get('title', existing_task.title),
        'status': data.get('status', existing_task.status.value if hasattr(existing_task.status, 'value') else existing_task.status),
        'priority': data.get('priority', existing_task.priority.value if hasattr(existing_task.priority, 'value') else existing_task.priority),
        'estimate_hours': data.get('estimate_hours', existing_task.estimate_hours),
        'due_date': data.get('due_date', existing_task.due_date),
        'created_by': existing_task.created_by,
        'assigned_id': data.get('assigned_id', existing_task.assigned_id)
    }

    try:
        task = Task(**task_data)
    except ValueError as e:
        return jsonify({"error": f"Invalid data: {str(e)}"}), 400

    try:
        task_service.update_task(task)
        return jsonify({"message": "Task updated successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@task_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        task_service.delete_task(task_id)
        return jsonify({"message": "Task deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@task_bp.route("/user/<int:user_id>/recent", methods=["GET"])
def user_recent_tasks(user_id):
    limit = request.args.get("limit", 5, type=int)
    tasks = task_service.get_user_recent_tasks(user_id, limit)
    return jsonify([t.to_dict() for t in tasks]), 200


@task_bp.route("/user/<int:user_id>/overdue", methods=["GET"])
def user_overdue_tasks(user_id):
    tasks = task_service.get_user_overdue_tasks(user_id)
    return jsonify([t.to_dict() for t in tasks]), 200


@task_bp.route("/status/<string:status>", methods=["GET"])
def tasks_by_status(status):
    tasks = task_service.get_tasks_by_status(status)
    return jsonify([t.to_dict() for t in tasks]), 200


@task_bp.route("/page", methods=["GET"])
def task_page():
    tasks = task_service.get_all_tasks()
    return render_template("home.html", tasks=tasks)


@task_bp.route("/backlog", methods=["GET"])
def get_backlog():
    tasks = task_service.get_backlog_tasks()
    return jsonify([t.to_dict() for t in tasks]), 200


# --- Define the reserved ID for the Backlog ---
BACKLOG_SPRINT_ID = 1 

@task_bp.route("/backlog", methods=["POST"])
def add_backlog_item():
    if not request.is_json:
        return jsonify({"error": "JSON body required"}), 400

    data = request.json

    # --- CHANGE: Use the reserved ID instead of NULL/None ---
    data["sprint_id"] = BACKLOG_SPRINT_ID
    # ... (other defaults, which seem correct) ...
    data.setdefault("status", "TODO")
    data.setdefault("priority", "MEDIUM")
    data.setdefault("estimate_hours", 0)
    data.setdefault("assigned_id", None)
    data.setdefault("created_by", 1)  # later from session

    try:
        task = Task(**data)
        # Assuming task_service uses TaskRepository.add_task() which handles created_at/updated_at
        task_id = task_service.create_backlog_task(task) 
        return jsonify({"task_id": task_id}), 201
    except Exception as e:
        # Added a check for required fields/errors to help debug further
        print(f"Error creating task: {e}") 
        return jsonify({"error": str(e)}), 500