from datetime import datetime, date, time, timedelta
from decimal import Decimal
from typing import Optional


class TimeTracking:
    def __init__(
        self,
        id: Optional[int] = None,
        user_id: Optional[int] = None,
        project_id: Optional[int] = None,
        task_id: Optional[int] = None,
        date_worked: Optional[date] = None,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None,
        duration_hours: Optional[Decimal] = None,
        description: Optional[str] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.project_id = project_id
        self.task_id = task_id
        
        # Handle date_worked conversion
        if isinstance(date_worked, str):
            self.date_worked = datetime.strptime(date_worked, "%Y-%m-%d").date()
        else:
            self.date_worked = date_worked
        
        # Handle start_time conversion
        if isinstance(start_time, str):
            self.start_time = datetime.strptime(start_time, "%H:%M:%S").time()
        else:
            self.start_time = start_time
        
        # Handle end_time conversion
        if isinstance(end_time, str):
            self.end_time = datetime.strptime(end_time, "%H:%M:%S").time()
        else:
            self.end_time = end_time
        
        # Handle duration_hours conversion
        if duration_hours is not None:
            self.duration_hours = Decimal(str(duration_hours))
        else:
            self.duration_hours = None
        
        self.description = description
        self.created_at = created_at

    def calculate_duration(self) -> None:
        """
        Calculate duration_hours based on start_time and end_time.
        Handles cases where end_time is before start_time (crossing midnight).
        """
        if not self.start_time or not self.end_time:
            return
        
        # Convert times to datetime for calculation
        start_dt = datetime.combine(date.today(), self.start_time)
        end_dt = datetime.combine(date.today(), self.end_time)
        
        # Handle crossing midnight
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        
        # Calculate duration in hours
        duration = end_dt - start_dt
        hours = Decimal(str(duration.total_seconds() / 3600))
        
        # Round to 2 decimal places
        self.duration_hours = hours.quantize(Decimal('0.01'))

    def is_valid(self) -> bool:
        """
        Validate the time tracking entry.
        Returns True if valid, False otherwise.
        """
        # Required fields
        if not self.user_id or self.user_id <= 0:
            return False
        
        if not self.project_id or self.project_id <= 0:
            return False
        
        if not self.date_worked:
            return False
        
        # Either duration_hours or both start/end times must be present
        has_duration = self.duration_hours is not None and self.duration_hours > 0
        has_times = self.start_time is not None and self.end_time is not None
        
        if not has_duration and not has_times:
            return False
        
        # If duration is provided, it must be positive and <= 24 hours
        if self.duration_hours is not None:
            if self.duration_hours <= 0 or self.duration_hours > 24:
                return False
        
        # If times are provided, end_time validation
        if has_times:
            # Calculate duration to validate
            start_dt = datetime.combine(date.today(), self.start_time)
            end_dt = datetime.combine(date.today(), self.end_time)
            
            # Handle crossing midnight
            if end_dt < start_dt:
                end_dt += timedelta(days=1)
            
            duration = end_dt - start_dt
            hours = duration.total_seconds() / 3600
            
            # Duration should be reasonable (> 0 and <= 24 hours)
            if hours <= 0 or hours > 24:
                return False
        
        # task_id is optional but must be positive if provided
        if self.task_id is not None and self.task_id <= 0:
            return False
        
        # description is optional but check length if provided
        if self.description and len(self.description) > 65535:  # TEXT field limit
            return False
        
        return True

    def to_dict(self):
        """Convert TimeTracking object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'task_id': self.task_id,
            'date_worked': self.date_worked.isoformat() if self.date_worked else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_hours': float(self.duration_hours) if self.duration_hours else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<TimeTracking(id={self.id}, user_id={self.user_id}, project_id={self.project_id}, task_id={self.task_id}, duration={self.duration_hours}h)>"