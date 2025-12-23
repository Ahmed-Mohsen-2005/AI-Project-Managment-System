from repositories.repository_factory import RepositoryFactory
from datetime import datetime

class DocumentationService:

    @staticmethod
    def generate_sprint_documentation(sprint_id):
        sprint_repo = RepositoryFactory.get_repository("sprint")
        task_repo = RepositoryFactory.get_repository("task")

        sprint = sprint_repo.get_by_id(sprint_id)
        if not sprint:
            raise ValueError("Sprint not found")

        tasks = task_repo.get_by_sprint(sprint_id)

        completed = [t for t in tasks if t.status == "DONE"]
        blocked = [t for t in tasks if t.status == "BLOCKED"]

        return {
            "sprint_info": {
                "sprint_id": sprint.sprint_id,
                "name": sprint.name,
                "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
            },
            "metrics": {
                "total_tasks": len(tasks),
                "completed_tasks": len(completed),
                "blocked_tasks": len(blocked),
                "completion_rate": round((len(completed) / len(tasks) * 100) if tasks else 0, 2)
            },
            "tasks": {
                "completed": [t.to_dict() for t in completed],
                "blocked": [t.to_dict() for t in blocked]
            },
            "ai_summary_prompt": DocumentationService._build_prompt(
                sprint, tasks, completed
            ),
            "generated_at": datetime.utcnow().isoformat()
        }

    @staticmethod
    def _build_prompt(sprint, tasks, completed):
        completed_text = "\n".join(
            f"- {t.title} ({t.estimate_hours or 0}h)" for t in completed
        )

        return f"""
You are a technical project manager.

Sprint: {sprint.name}
Total Tasks: {len(tasks)}
Completed Tasks: {len(completed)}

Completed Work:
{completed_text or "No completed tasks"}

Create:
1. Executive Summary
2. Key Accomplishments
3. Metrics Overview
4. Recommendations
"""
