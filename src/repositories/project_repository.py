from models.project import Project
from core.db_singleton import DatabaseConnection
from datetime import date

class ProjectRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT project_id, name, description, start_date, end_date, budget FROM Project")
        rows = cursor.fetchall()
        return [Project(**row) for row in rows]

    def get_by_id(self, project_id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT project_id, name, description, start_date, end_date, budget FROM Project WHERE project_id=%s", (project_id,))
        row = cursor.fetchone()
        return Project(**row) if row else None

    def get_project_stats(self, project_id):
        cursor = self.db.cursor(dictionary=True)

        # Get tasks stats for the project (via sprints)
        cursor.execute("""
            SELECT
                COUNT(*) as total_tasks,
                SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.status != 'DONE' THEN 1 ELSE 0 END) as remaining_tasks,
                SUM(CASE WHEN t.priority = 'HIGH' AND t.assigned_id IS NULL THEN 1 ELSE 0 END) as unassigned_critical
            FROM Task t
            JOIN Sprint s ON t.sprint_id = s.sprint_id
            WHERE s.project_id = %s
        """, (project_id,))
        task_stats = cursor.fetchone()

        total = task_stats['total_tasks'] or 0
        completed = task_stats['completed_tasks'] or 0
        remaining = task_stats['remaining_tasks'] or 0
        unassigned_critical = task_stats['unassigned_critical'] or 0

        # Calculate velocity
        velocity = round((completed / total * 100), 1) if total > 0 else 0

        # Get project budget
        cursor.execute("SELECT budget FROM Project WHERE project_id = %s", (project_id,))
        project = cursor.fetchone()
        budget = project['budget'] if project and project['budget'] else 0

        cursor.close()

        return {
            "velocity": f"{velocity}%",
            "tasksRemaining": remaining,
            "aiRiskIndex": min(100, max(0, 100 - velocity)),  # Simple risk calculation
            "budgetForecast": f"${budget:,.0f}",
            "totalTasks": total,
            "completedTasks": completed,
            "unassignedCritical": unassigned_critical
        }

    def get_critical_tasks(self, project_id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.task_id, t.title, t.priority, t.assigned_id
            FROM Task t
            JOIN Sprint s ON t.sprint_id = s.sprint_id
            WHERE s.project_id = %s
            AND t.priority IN ('HIGH', 'MEDIUM')
            AND t.assigned_id IS NULL
            AND t.status != 'DONE'
            ORDER BY
                CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END
            LIMIT 10
        """, (project_id,))
        rows = cursor.fetchall()
        cursor.close()

        return [{
            "id": row['task_id'],
            "title": row['title'],
            "priority": "P1" if row['priority'] == 'HIGH' else "P2"
        } for row in rows]

    def get_recent_activities(self, project_id, limit=10):
        cursor = self.db.cursor(dictionary=True)
        # Get recent task activities for the project
        cursor.execute("""
            SELECT ua.action, ua.timestamp, u.name as user_name
            FROM UserActivity ua
            JOIN userr u ON ua.user_id = u.user_id
            JOIN Task t ON ua.action LIKE CONCAT('%%', t.title, '%%')
            JOIN Sprint s ON t.sprint_id = s.sprint_id
            WHERE s.project_id = %s
            ORDER BY ua.timestamp DESC
            LIMIT %s
        """, (project_id, limit))
        rows = cursor.fetchall()
        cursor.close()

        if not rows:
            # Return default activities if none found
            return [{
                "time": "Just now",
                "type": "System",
                "detail": "Dashboard loaded successfully."
            }]

        activities = []
        for row in rows:
            time_diff = date.today() - row['timestamp'].date() if hasattr(row['timestamp'], 'date') else date.today()
            if time_diff.days == 0:
                time_str = "Today"
            elif time_diff.days == 1:
                time_str = "Yesterday"
            else:
                time_str = f"{time_diff.days}d ago"

            activities.append({
                "time": time_str,
                "type": "Activity",
                "detail": f"{row['user_name']}: {row['action']}"
            })

        return activities