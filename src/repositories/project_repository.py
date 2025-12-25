from models.project import Project
from core.db_singleton import DatabaseConnection
from datetime import date

class ProjectRepository:
    def __init__(self):
        # Store the manager instance, not a single connection
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT project_id, name, description, start_date, end_date, budget FROM Project ORDER BY name ASC"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Project(**row) for row in rows]
        finally:
            # Always return connection to the pool
            cursor.close()
            conn.close()

    def get_by_id(self, id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT project_id, name, description, start_date, end_date, budget FROM Project WHERE project_id=%s", 
                (id,)
            )
            row = cursor.fetchone()
            return Project(**row) if row else None
        finally:
            cursor.close()
            conn.close()

    def create(self, project: Project):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
            INSERT INTO Project (name, description, start_date, end_date, budget) 
            VALUES (%s, %s, %s, %s, %s)
            """
            values = (
                project.name, 
                project.description, 
                project.start_date, 
                project.end_date, 
                project.budget
            )
            cursor.execute(query, values)
            conn.commit()  # Use the local connection object for commit
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def get_user_projects(self, user_id):
        """Get projects assigned to a specific user via project_user join"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT p.project_id, p.name, p.description, p.start_date, p.end_date, p.budget
                FROM Project p
                INNER JOIN project_user pu ON p.project_id = pu.project_id
                WHERE pu.user_id = %s
                ORDER BY p.name ASC
            """, (user_id,))
            rows = cursor.fetchall()
            print(f"[PROJECT_REPO] Found {len(rows)} projects for user {user_id}")
            return [Project(**row) for row in rows]
        except Exception as e:
            print(f"[PROJECT_REPO] Error in get_user_projects: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_project_stats(self, project_id):
        """Get dashboard statistics for a project."""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Count total and completed tasks (join with Sprint to filter by project)
            cursor.execute("""
                SELECT
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(CASE WHEN t.status != 'DONE' THEN 1 ELSE 0 END) as remaining_tasks,
                    SUM(CASE WHEN t.priority = 'HIGH' AND t.assigned_id IS NULL THEN 1 ELSE 0 END) as unassigned_critical
                FROM Task t
                INNER JOIN Sprint s ON t.sprint_id = s.sprint_id
                WHERE s.project_id = %s
            """, (project_id,))
            task_stats = cursor.fetchone()

            # Calculate velocity
            total = task_stats['total_tasks'] or 1
            completed = task_stats['completed_tasks'] or 0
            velocity = round((completed / total) * 100, 1)

            # Get project budget
            cursor.execute("SELECT budget FROM Project WHERE project_id = %s", (project_id,))
            project = cursor.fetchone()
            budget = project['budget'] if project else 0

            # Calculate simple AI risk index (based on unassigned critical tasks and velocity)
            unassigned = task_stats['unassigned_critical'] or 0
            risk_index = min(100, (unassigned * 15) + max(0, (100 - velocity)))

            return {
                "velocity": f"{velocity}%",
                "aiRiskIndex": int(risk_index),
                "tasksRemaining": task_stats['remaining_tasks'] or 0,
                "budgetForecast": f"${budget:,.0f}" if budget else "$0",
                "unassignedCritical": unassigned,
                "totalTasks": total
            }
        finally:
            cursor.close()
            conn.close()

    def get_critical_tasks(self, project_id):
        """Get unassigned critical tasks for a project."""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT t.task_id as id, t.title, t.priority
                FROM Task t
                INNER JOIN Sprint s ON t.sprint_id = s.sprint_id
                WHERE s.project_id = %s
                AND t.priority = 'HIGH'
                AND t.assigned_id IS NULL
                AND t.status != 'DONE'
                ORDER BY t.task_id DESC
                LIMIT 10
            """, (project_id,))
            rows = cursor.fetchall()
            return rows
        finally:
            cursor.close()
            conn.close()

    def get_recent_activities(self, project_id, limit=10):
        """Get recent activities for a project."""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Get recent task updates (join with Sprint to filter by project)
            cursor.execute("""
                SELECT
                    CONCAT('Task "', t.title, '" status: ', t.status) as detail,
                    NOW() as activity_time
                FROM Task t
                INNER JOIN Sprint s ON t.sprint_id = s.sprint_id
                WHERE s.project_id = %s
                ORDER BY t.task_id DESC
                LIMIT %s
            """, (project_id, limit))
            rows = cursor.fetchall()

            # Format activities
            from datetime import datetime
            activities = []
            for row in rows:
                if row['activity_time']:
                    time_diff = self._format_time_ago(row['activity_time'])
                    activities.append({
                        "time": time_diff,
                        "detail": row['detail']
                    })

            return activities
        finally:
            cursor.close()
            conn.close()

    def _format_time_ago(self, timestamp):
        """Format timestamp as relative time."""
        from datetime import datetime
        now = datetime.now()
        diff = now - timestamp

        if diff.days > 7:
            return f"{diff.days // 7} week{'s' if diff.days // 7 > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} min{'utes' if minutes > 1 else ''} ago"
        else:
            return "Just now"

