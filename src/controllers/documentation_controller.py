from flask import Blueprint, jsonify, request
from repositories.repository_factory import RepositoryFactory
from datetime import datetime
import os
import requests
from flask import request

documentation_bp = Blueprint("documentation", __name__, url_prefix="/api/v1/documentation")

@documentation_bp.route("/sprint/<int:sprint_id>", methods=["GET"])
def generate_sprint_documentation(sprint_id):
    """
    Generate comprehensive documentation for a completed sprint.
    This endpoint compiles all tasks, notes, and generates an AI summary.
    """
    try:
        # Get repositories
        sprint_repo = RepositoryFactory.get_repository("sprint")
        task_repo = RepositoryFactory.get_repository("task")
        
        # Get sprint details
        sprint = sprint_repo.get_by_id(sprint_id)
        if not sprint:
            return jsonify({"error": f"Sprint {sprint_id} not found"}), 404
        
        # Get all tasks for this sprint
        tasks = task_repo.get_by_sprint(sprint_id)
        
        # Categorize tasks by status
        completed_tasks = [t for t in tasks if t.status == 'DONE']
        in_progress_tasks = [t for t in tasks if t.status == 'IN_PROGRESS']
        blocked_tasks = [t for t in tasks if t.status == 'BLOCKED']
        todo_tasks = [t for t in tasks if t.status == 'TODO']
        
        # Calculate sprint metrics
        total_tasks = len(tasks)
        completion_rate = (len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0
        total_estimate = sum(t.estimate_hours or 0 for t in tasks)
        completed_estimate = sum(t.estimate_hours or 0 for t in completed_tasks)
        
        # Build documentation structure
        documentation = {
            "sprint_info": {
                "sprint_id": sprint.sprint_id,
                "name": sprint.name,
                "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                "velocity": sprint.velocity if hasattr(sprint, 'velocity') else None,
            },
            "metrics": {
                "total_tasks": total_tasks,
                "completed_tasks": len(completed_tasks),
                "in_progress_tasks": len(in_progress_tasks),
                "blocked_tasks": len(blocked_tasks),
                "todo_tasks": len(todo_tasks),
                "completion_rate": round(completion_rate, 2),
                "total_estimated_hours": total_estimate,
                "completed_hours": completed_estimate,
                "hours_completion_rate": round((completed_estimate / total_estimate * 100) if total_estimate > 0 else 0, 2)
            },
            "tasks": {
                "completed": [t.to_dict() for t in completed_tasks],
                "in_progress": [t.to_dict() for t in in_progress_tasks],
                "blocked": [t.to_dict() for t in blocked_tasks],
                "todo": [t.to_dict() for t in todo_tasks]
            },
            "generated_at": datetime.now().isoformat(),
            "ai_summary_prompt": _generate_ai_summary_prompt(sprint, tasks, completed_tasks)
        }
        
        return jsonify(documentation), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documentation_bp.route("/sprint/<int:sprint_id>/summary", methods=["POST"])
def generate_ai_sprint_summary(sprint_id):
    """
    Generate an AI-powered summary of the sprint using Claude.
    This uses the Anthropic API available in artifacts.
    """
    try:
        sprint_repo = RepositoryFactory.get_repository("sprint")
        task_repo = RepositoryFactory.get_repository("task")
        
        sprint = sprint_repo.get_by_id(sprint_id)
        if not sprint:
            return jsonify({"error": f"Sprint {sprint_id} not found"}), 404
        
        tasks = task_repo.get_by_sprint(sprint_id)
        completed_tasks = [t for t in tasks if t.status == 'DONE']
        
        # Get the AI summary from request body (generated in the frontend)
        data = request.get_json()
        ai_summary = data.get('ai_summary', '')
        
        # Save the documentation (you can add a Documentation model/repository later)
        documentation_record = {
            "sprint_id": sprint_id,
            "summary": ai_summary,
            "generated_at": datetime.now().isoformat(),
            "task_count": len(tasks),
            "completion_rate": (len(completed_tasks) / len(tasks) * 100) if len(tasks) > 0 else 0
        }
        
        return jsonify({
            "message": "Sprint summary generated successfully",
            "documentation": documentation_record
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _generate_ai_summary_prompt(sprint, tasks, completed_tasks):
    """
    Generate a prompt for AI to create a comprehensive sprint summary.
    This will be used in the frontend to call Claude API.
    """
    completed_list = "\n".join([f"- {t.title} (Priority: {t.priority}, {t.estimate_hours or 0}h)" for t in completed_tasks])
    
    prompt = f"""You are a technical project manager creating a sprint retrospective document.

Sprint: {sprint.name}
Duration: {sprint.start_date} to {sprint.end_date}
Total Tasks: {len(tasks)}
Completed Tasks: {len(completed_tasks)}

Completed Work:
{completed_list if completed_list else "No tasks completed"}

Please generate a comprehensive sprint summary document that includes:
1. Executive Summary (2-3 sentences)
2. Key Accomplishments (bullet points)
3. Technical Highlights (what was built/improved)
4. Metrics Overview (completion rate, velocity)
5. Recommendations for Next Sprint

Format the response in Markdown for easy readability."""
    
    return prompt


@documentation_bp.route("/project/<int:project_id>/report", methods=["GET"])
def generate_project_documentation(project_id):
    """
    Generate comprehensive documentation for an entire project across all sprints.
    """
    try:
        sprint_repo = RepositoryFactory.get_repository("sprint")
        task_repo = RepositoryFactory.get_repository("task")
        
        # Get all sprints for the project
        sprints = sprint_repo.get_by_project_id(project_id)
        
        if not sprints:
            return jsonify({"error": f"No sprints found for project {project_id}"}), 404
        
        # Compile data from all sprints
        all_tasks = []
        sprint_summaries = []
        
        for sprint in sprints:
            tasks = task_repo.get_by_sprint(sprint.sprint_id)
            all_tasks.extend(tasks)
            
            completed = [t for t in tasks if t.status == 'DONE']
            sprint_summaries.append({
                "sprint_name": sprint.name,
                "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                "total_tasks": len(tasks),
                "completed_tasks": len(completed),
                "completion_rate": round((len(completed) / len(tasks) * 100) if len(tasks) > 0 else 0, 2)
            })
        
        # Overall project metrics
        total_completed = sum(1 for t in all_tasks if t.status == 'DONE')
        
        documentation = {
            "project_id": project_id,
            "total_sprints": len(sprints),
            "sprint_summaries": sprint_summaries,
            "overall_metrics": {
                "total_tasks": len(all_tasks),
                "completed_tasks": total_completed,
                "overall_completion_rate": round((total_completed / len(all_tasks) * 100) if len(all_tasks) > 0 else 0, 2)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return jsonify(documentation), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    



ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

@documentation_bp.route("/sprint/<int:sprint_id>/ai-summary", methods=["POST"])
def generate_ai_summary_backend(sprint_id):
    try:
        data = request.get_json()
        prompt = data.get("prompt")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {os.getenv('ANTHROPIC_API_KEY')}",
            "anthropic-version": "2023-06-01"
        }

        payload = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": 600,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            json=payload,
            headers=headers
        )

        print("Claude status:", response.status_code)
        print("Claude response:", response.text)

        response.raise_for_status()

        result = response.json()
        text = "".join(
            block["text"]
            for block in result["content"]
            if block["type"] == "text"
        )

        return jsonify({"summary": text}), 200

    except Exception as e:
        print("AI SUMMARY ERROR:", str(e))
        return jsonify({"error": str(e)}), 500
