from repositories.time_repository import TimeTrackingRepository
from models.time import TimeTracking
from datetime import date
from typing import List, Optional


class TimeTrackingService:
    def __init__(self):
        self.repository = TimeTrackingRepository()

    def get_all_entries(self) -> List[TimeTracking]:
        """Get all time entries"""
        return self.repository.get_all()

    def get_entry_by_id(self, time_id: int) -> TimeTracking:
        """Get a specific time entry by ID"""
        entry = self.repository.get_by_id(time_id)
        if not entry:
            raise ValueError(f"Time entry with ID {time_id} not found")
        return entry

    def get_entries_by_user(self, user_id: int) -> List[TimeTracking]:
        """Get all time entries for a specific user"""
        return self.repository.get_by_user(user_id)

    def get_entries_by_project(self, project_id: int) -> List[TimeTracking]:
        """Get all time entries for a specific project"""
        return self.repository.get_by_project(project_id)

    def get_entries_by_task(self, task_id: int) -> List[TimeTracking]:
        """Get all time entries for a specific task"""
        return self.repository.get_by_task(task_id)

    def get_entries_by_date_range(self, start_date: date, end_date: date, user_id: Optional[int] = None) -> List[TimeTracking]:
        """Get time entries within a date range"""
        return self.repository.get_by_date_range(start_date, end_date, user_id)

    def get_today_entries_by_user(self, user_id: int) -> List[TimeTracking]:
        """Get today's time entries for a user"""
        return self.repository.get_today_by_user(user_id)

    def create_entry(self, time_entry: TimeTracking) -> int:
        """Create a new time entry"""
        if not time_entry.is_valid():
            raise ValueError("Invalid time entry data")
        
        entry_id = self.repository.create(time_entry)
        if not entry_id:
            raise ValueError("Failed to create time entry")
        return entry_id

    def update_entry(self, time_id: int, time_entry: TimeTracking) -> None:
        """Update an existing time entry"""
        # Check if entry exists
        existing = self.repository.get_by_id(time_id)
        if not existing:
            raise ValueError(f"Time entry with ID {time_id} not found")
        
        if not time_entry.is_valid():
            raise ValueError("Invalid time entry data")
        
        success = self.repository.update(time_id, time_entry)
        if not success:
            raise ValueError(f"Failed to update time entry {time_id}")

    def delete_entry(self, time_id: int) -> None:
        """Delete a time entry"""
        success = self.repository.delete(time_id)
        if not success:
            raise ValueError(f"Time entry with ID {time_id} not found")

    def get_total_hours_by_project(self, project_id: int) -> float:
        """Get total hours logged for a project"""
        return self.repository.get_total_hours_by_project(project_id)

    def get_total_hours_by_task(self, task_id: int) -> float:
        """Get total hours logged for a task"""
        return self.repository.get_total_hours_by_task(task_id)

    def get_total_hours_by_user(self, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> float:
        """Get total hours logged by a user"""
        return self.repository.get_total_hours_by_user(user_id, start_date, end_date)
