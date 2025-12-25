from core.db_singleton import DatabaseConnection
from models.time import TimeTracking
from datetime import date, time
from typing import List, Optional


class TimeTrackingRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self) -> List[TimeTracking]:
        """Retrieve all time tracking entries"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking 
                ORDER BY date_worked DESC, start_time DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_all] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, time_id: int) -> Optional[TimeTracking]:
        """Retrieve a specific time entry by ID"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking 
                WHERE id = %s
            """
            cursor.execute(query, (time_id,))
            row = cursor.fetchone()
            return TimeTracking(**row) if row else None
        except Exception as e:
            print(f"[TimeTrackingRepository][get_by_id] Error: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def get_by_user(self, user_id: int) -> List[TimeTracking]:
        """Retrieve all time entries for a specific user"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking
                WHERE user_id = %s
                ORDER BY date_worked DESC, start_time DESC
            """
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_by_user] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_by_project(self, project_id: int) -> List[TimeTracking]:
        """Retrieve all time entries for a specific project"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking
                WHERE project_id = %s
                ORDER BY date_worked DESC, start_time DESC
            """
            cursor.execute(query, (project_id,))
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_by_project] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_by_task(self, task_id: int) -> List[TimeTracking]:
        """Retrieve all time entries for a specific task"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking
                WHERE task_id = %s
                ORDER BY date_worked DESC, start_time DESC
            """
            cursor.execute(query, (task_id,))
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_by_task] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_by_date_range(self, start_date: date, end_date: date, user_id: Optional[int] = None) -> List[TimeTracking]:
        """Retrieve time entries within a date range, optionally filtered by user"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            if user_id:
                query = """
                    SELECT id, user_id, project_id, task_id, date_worked, 
                           start_time, end_time, duration_hours, description, created_at
                    FROM time_tracking
                    WHERE date_worked BETWEEN %s AND %s
                    AND user_id = %s
                    ORDER BY date_worked DESC, start_time DESC
                """
                cursor.execute(query, (start_date, end_date, user_id))
            else:
                query = """
                    SELECT id, user_id, project_id, task_id, date_worked, 
                           start_time, end_time, duration_hours, description, created_at
                    FROM time_tracking
                    WHERE date_worked BETWEEN %s AND %s
                    ORDER BY date_worked DESC, start_time DESC
                """
                cursor.execute(query, (start_date, end_date))
            
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_by_date_range] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def create(self, time_entry: TimeTracking) -> Optional[int]:
        """Create a new time tracking entry"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                INSERT INTO time_tracking 
                (user_id, project_id, task_id, date_worked, start_time, end_time, 
                 duration_hours, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                query,
                (
                    time_entry.user_id,
                    time_entry.project_id,
                    time_entry.task_id,  # Can be NULL
                    time_entry.date_worked,
                    time_entry.start_time,  # Can be NULL
                    time_entry.end_time,    # Can be NULL
                    time_entry.duration_hours,
                    time_entry.description  # Can be NULL
                )
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            print(f"[TimeTrackingRepository][create] Error: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def update(self, time_id: int, time_entry: TimeTracking) -> bool:
        """Update an existing time tracking entry"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                UPDATE time_tracking
                SET user_id = %s, 
                    project_id = %s, 
                    task_id = %s, 
                    date_worked = %s, 
                    start_time = %s, 
                    end_time = %s,
                    duration_hours = %s, 
                    description = %s
                WHERE id = %s
            """
            cursor.execute(
                query,
                (
                    time_entry.user_id,
                    time_entry.project_id,
                    time_entry.task_id,
                    time_entry.date_worked,
                    time_entry.start_time,
                    time_entry.end_time,
                    time_entry.duration_hours,
                    time_entry.description,
                    time_id
                )
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"[TimeTrackingRepository][update] Error: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def delete(self, time_id: int) -> bool:
        """Delete a time tracking entry"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "DELETE FROM time_tracking WHERE id = %s"
            cursor.execute(query, (time_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"[TimeTrackingRepository][delete] Error: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def get_total_hours_by_project(self, project_id: int) -> float:
        """Calculate total hours logged for a specific project"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                SELECT COALESCE(SUM(duration_hours), 0) as total
                FROM time_tracking
                WHERE project_id = %s
            """
            cursor.execute(query, (project_id,))
            result = cursor.fetchone()
            return float(result[0]) if result else 0.0
        except Exception as e:
            print(f"[TimeTrackingRepository][get_total_hours_by_project] Error: {e}")
            return 0.0
        finally:
            cursor.close()
            conn.close()

    def get_total_hours_by_task(self, task_id: int) -> float:
        """Calculate total hours logged for a specific task"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                SELECT COALESCE(SUM(duration_hours), 0) as total
                FROM time_tracking
                WHERE task_id = %s
            """
            cursor.execute(query, (task_id,))
            result = cursor.fetchone()
            return float(result[0]) if result else 0.0
        except Exception as e:
            print(f"[TimeTrackingRepository][get_total_hours_by_task] Error: {e}")
            return 0.0
        finally:
            cursor.close()
            conn.close()

    def get_total_hours_by_user(self, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> float:
        """Calculate total hours logged by a user, optionally within a date range"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            if start_date and end_date:
                query = """
                    SELECT COALESCE(SUM(duration_hours), 0) as total
                    FROM time_tracking
                    WHERE user_id = %s AND date_worked BETWEEN %s AND %s
                """
                cursor.execute(query, (user_id, start_date, end_date))
            else:
                query = """
                    SELECT COALESCE(SUM(duration_hours), 0) as total
                    FROM time_tracking
                    WHERE user_id = %s
                """
                cursor.execute(query, (user_id,))
            
            result = cursor.fetchone()
            return float(result[0]) if result else 0.0
        except Exception as e:
            print(f"[TimeTrackingRepository][get_total_hours_by_user] Error: {e}")
            return 0.0
        finally:
            cursor.close()
            conn.close()

    def get_by_user_and_project(self, user_id: int, project_id: int) -> List[TimeTracking]:
        """Retrieve time entries for a specific user on a specific project"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking
                WHERE user_id = %s AND project_id = %s
                ORDER BY date_worked DESC, start_time DESC
            """
            cursor.execute(query, (user_id, project_id))
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_by_user_and_project] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    def get_today_by_user(self, user_id: int) -> List[TimeTracking]:
        """Retrieve today's time entries for a specific user"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT id, user_id, project_id, task_id, date_worked, 
                       start_time, end_time, duration_hours, description, created_at
                FROM time_tracking
                WHERE user_id = %s AND date_worked = CURDATE()
                ORDER BY start_time DESC
            """
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            return [TimeTracking(**row) for row in rows]
        except Exception as e:
            print(f"[TimeTrackingRepository][get_today_by_user] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close()