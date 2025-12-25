from flask import Blueprint, jsonify, request,make_response, render_template
from services.documentation_service import DocumentationService
from services.ai_prediction_service import AIService
from repositories.repository_factory import RepositoryFactory
from datetime import datetime
from io import BytesIO
from xhtml2pdf import pisa

documentation_bp = Blueprint(
    "documentation",
    __name__,
    url_prefix="/api/v1/documentation"
)

from flask import request, make_response, render_template
from io import BytesIO
from xhtml2pdf import pisa
from datetime import datetime
# Ensure RepositoryFactory is imported

def export_project_pdf(project_id):
    """Generates a PDF from AI-generated HTML content sent by the frontend."""
    data = request.get_json()
    ai_html_body = data.get('content', '')
    report_type_name = data.get('report_type', 'AI Analysis')

    # Fetch project details for the header via Factory
    try:
        project_repo = RepositoryFactory.get_repository("project")
        project = project_repo.get_by_id(project_id)
        project_name = project['name'] if project else f"Project {project_id}"
    except Exception:
        project_name = "Project Documentation"

    # Define inline styles for the PDF (pisa prefers inline CSS)
    # We use a f-string for a simple template or use render_template()
    pdf_html = f"""
    <html>
    <head>
        <style>
            @page {{ size: A4; margin: 1.5cm; }}
            body {{ font-family: Helvetica, sans-serif; color: #333; line-height: 1.4; }}
            .header {{ border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }}
            h1 {{ color: #1e3a8a; margin: 0; }}
            h2 {{ color: #3b82f6; margin-top: 5px; font-size: 16px; }}
            .date {{ font-size: 10px; color: #666; text-align: right; }}
            .content {{ font-size: 11px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
            th, td {{ border: 1px solid #e5e7eb; padding: 8px; text-align: left; }}
            th {{ background-color: #f3f4f6; font-weight: bold; }}
            .footer {{ position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 5px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="date">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</div>
            <h1>{project_name}</h1>
            <h2>{report_type_name}</h2>
        </div>
        <div class="content">
            {ai_html_body}
        </div>
        <div class="footer">Project Sentinel AI Management System - Confidential</div>
    </body>
    </html>
    """

    # Generate PDF
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(BytesIO(pdf_html.encode("UTF-8")), dest=pdf_buffer)

    if pisa_status.err:
        return {"error": "Failed to generate PDF"}, 500

    response = make_response(pdf_buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=Project_Report_{project_id}.pdf'
    
    return response
# @documentation_bp.route("/sprint/<int:sprint_id>", methods=["GET"])
# def get_sprint_documentation(sprint_id):
#     return jsonify(
#         DocumentationService.generate_sprint_documentation(sprint_id)
#     ), 200


# @documentation_bp.route("/sprint/<int:sprint_id>/ai-summary", methods=["POST"])
# def generate_ai_summary(sprint_id):
#     data = request.get_json()
#     summary = AIService.generate_summary(data["prompt"])
#     return jsonify({"summary": summary}), 200



@documentation_bp.route("/project/<int:project_id>", methods=["GET"])
def generate_project_documentation(project_id):
    """
    Generate comprehensive documentation for an entire project
    Includes: sprints, tasks, and notes
    """
    try:
        project_repo = RepositoryFactory.get_repository("project")
        sprint_repo = RepositoryFactory.get_repository("sprint")
        task_repo = RepositoryFactory.get_repository("task")
        note_repo = RepositoryFactory.get_repository("note")
        
        # Get project details
        project = project_repo.get_by_id(project_id)
        if not project:
            return jsonify({"error": f"Project {project_id} not found"}), 404
        
        # Get all sprints for this project
        sprints = sprint_repo.get_by_project_id(project_id)
        
        # Get all tasks across all sprints
        all_tasks = []
        sprint_summaries = []
        
        for sprint in sprints:
            tasks = task_repo.get_by_sprint(sprint.sprint_id)
            all_tasks.extend(tasks)
            
            completed = [t for t in tasks if t.status == 'DONE']
            blocked = [t for t in tasks if t.status == 'BLOCKED']
            in_progress = [t for t in tasks if t.status == 'IN_PROGRESS']
            
            sprint_summaries.append({
                "sprint_id": sprint.sprint_id,
                "name": sprint.name,
                "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                "total_tasks": len(tasks),
                "completed_tasks": len(completed),
                "blocked_tasks": len(blocked),
                "in_progress_tasks": len(in_progress),
                "completion_rate": round((len(completed) / len(tasks) * 100) if len(tasks) > 0 else 0, 2),
                "velocity": sprint.velocity if hasattr(sprint, 'velocity') else 0
            })
        
        # Get all notes for this project
        try:
            all_notes = note_repo.get_by_project_id(project_id)
            notes_data = [{
                "note_id": note.note_id,
                "content": note.content,
                "created_at": note.created_at.isoformat() if hasattr(note, 'created_at') and note.created_at else None,
                "created_by": note.created_by if hasattr(note, 'created_by') else None,
                "task_id": note.task_id if hasattr(note, 'task_id') else None
            } for note in all_notes]
        except Exception as e:
            print(f"[WARNING] Could not fetch notes: {e}")
            notes_data = []
        
        # Calculate overall project metrics
        total_completed = sum(1 for t in all_tasks if t.status == 'DONE')
        total_blocked = sum(1 for t in all_tasks if t.status == 'BLOCKED')
        total_estimate = sum(t.estimate_hours or 0 for t in all_tasks)
        completed_estimate = sum(t.estimate_hours or 0 for t in all_tasks if t.status == 'DONE')
        
        documentation = {
            "project_info": {
                "project_id": project.project_id,
                "name": project.name if hasattr(project, 'name') else f"Project {project_id}",
                "description": project.description if hasattr(project, 'description') else None
            },
            "overall_metrics": {
                "total_sprints": len(sprints),
                "total_tasks": len(all_tasks),
                "completed_tasks": total_completed,
                "blocked_tasks": total_blocked,
                "overall_completion_rate": round((total_completed / len(all_tasks) * 100) if len(all_tasks) > 0 else 0, 2),
                "total_estimated_hours": total_estimate,
                "completed_hours": completed_estimate,
                "average_sprint_velocity": round(sum(s['velocity'] for s in sprint_summaries) / len(sprint_summaries), 2) if sprint_summaries else 0
            },
            "sprint_summaries": sprint_summaries,
            "tasks": {
                "completed": [t.to_dict() for t in all_tasks if t.status == 'DONE'],
                "blocked": [t.to_dict() for t in all_tasks if t.status == 'BLOCKED'],
                "in_progress": [t.to_dict() for t in all_tasks if t.status == 'IN_PROGRESS']
            },
            "notes": notes_data,
            "generated_at": datetime.now().isoformat(),
            "ai_summary_prompt": _generate_project_summary_prompt(project, sprints, all_tasks, notes_data)
        }
        
        return jsonify(documentation), 200
        
    except Exception as e:
        print(f"[ERROR] Project documentation generation failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def _generate_project_summary_prompt(project, sprints, tasks, notes):
    """
    Generate a comprehensive AI prompt including notes
    """
    completed_tasks = [t for t in tasks if t.status == 'DONE']
    blocked_tasks = [t for t in tasks if t.status == 'BLOCKED']
    
    completed_list = "\n".join([f"- {t.title} (Priority: {t.priority}, {t.estimate_hours or 0}h)" for t in completed_tasks[:20]])
    blocked_list = "\n".join([f"- {t.title} (Reason: TBD)" for t in blocked_tasks[:10]])
    
    # Include notes in the prompt
    notes_summary = "\n".join([f"- Note {i+1}: {note['content'][:200]}..." if len(note['content']) > 200 else f"- Note {i+1}: {note['content']}" for i, note in enumerate(notes[:10])])
    
    sprint_summary = "\n".join([f"- {s.name}: {s.start_date} to {s.end_date}" for s in sprints[:5]])
    
    prompt = f"""You are a technical project manager creating a comprehensive project analysis report.

PROJECT: {project.name if hasattr(project, 'name') else f'Project {project.project_id}'}
Total Sprints: {len(sprints)}
Total Tasks: {len(tasks)}
Completed Tasks: {len(completed_tasks)}
Blocked Tasks: {len(blocked_tasks)}

SPRINT HISTORY:
{sprint_summary if sprint_summary else "No sprints completed"}

COMPLETED WORK:
{completed_list if completed_list else "No tasks completed"}

BLOCKED TASKS:
{blocked_list if blocked_list else "No blocked tasks"}

PROJECT NOTES & INSIGHTS:
{notes_summary if notes_summary else "No notes available"}

Please generate a comprehensive project report that includes:
1. Executive Summary (3-4 sentences)
2. Key Accomplishments (bullet points with specific deliverables)
3. Sprint Performance Analysis (velocity, completion trends)
4. Blockers & Risk Assessment (identify patterns from blocked tasks and notes)
5. Team Insights (based on notes and task patterns)
6. Recommendations for Improvement
7. Next Steps & Action Items

Format the response in Markdown for easy readability with clear sections and tables where appropriate."""
    
    return prompt


@documentation_bp.route("/project/<int:project_id>/ai-summary", methods=["POST"])
def generate_project_ai_summary(project_id):
    """Generate AI-powered summary for project"""
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        # Use AI service to generate summary
        from services.ai_prediction_service import AIService
        ai_service = AIService()
        summary = ai_service.generate_summary(prompt)
        
        return jsonify({"summary": summary}), 200
        
    except Exception as e:
        print(f"[ERROR] AI summary generation failed: {e}")
        return jsonify({"error": str(e)}), 500


# Keep existing sprint endpoint for backward compatibility
@documentation_bp.route("/sprint/<int:sprint_id>", methods=["GET"])
def generate_sprint_documentation(sprint_id):
    """Generate documentation for a single sprint"""
    try:
        sprint_repo = RepositoryFactory.get_repository("sprint")
        task_repo = RepositoryFactory.get_repository("task")
        
        sprint = sprint_repo.get_by_id(sprint_id)
        if not sprint:
            return jsonify({"error": f"Sprint {sprint_id} not found"}), 404
        
        tasks = task_repo.get_by_sprint(sprint_id)
        
        completed_tasks = [t for t in tasks if t.status == 'DONE']
        in_progress_tasks = [t for t in tasks if t.status == 'IN_PROGRESS']
        blocked_tasks = [t for t in tasks if t.status == 'BLOCKED']
        todo_tasks = [t for t in tasks if t.status == 'TODO']
        
        total_tasks = len(tasks)
        completion_rate = (len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0
        total_estimate = sum(t.estimate_hours or 0 for t in tasks)
        completed_estimate = sum(t.estimate_hours or 0 for t in completed_tasks)
        
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
            "generated_at": datetime.now().isoformat()
        }
        
        return jsonify(documentation), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documentation_bp.route("/sprint/<int:sprint_id>/ai-summary", methods=["POST"])
def generate_ai_sprint_summary(sprint_id):
    """Generate AI summary for sprint"""
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        
        from services.ai_prediction_service import AIService
        ai_service = AIService()
        summary = ai_service.generate_summary(prompt)
        
        return jsonify({"summary": summary}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
