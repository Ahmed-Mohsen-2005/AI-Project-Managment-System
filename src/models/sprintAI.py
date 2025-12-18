from datetime import datetime, timedelta
from src.repositories.repository_factory import RepositoryFactory
class SprintAI:
    @staticmethod
    def analyze_and_adjust(sprint_id):
        repo = RepositoryFactory.get_repository("sprint")
        sprint = repo.get_by_id(sprint_id)
        tasks = repo.get_tasks_for_sprint(sprint_id) # Need to implement this
        
        # 1. Check for Delays (Scenario: High-priority tasks behind)
        late_high_priority = [t for t in tasks if t.priority == 'High' and t.status != 'Done']
        progress_ratio = sum(t.points for t in tasks if t.status == 'Done') / sum(t.points for t in tasks)
        time_ratio = (datetime.now() - sprint.start_date).days / (sprint.end_date - sprint.start_date).days

        if progress_ratio < time_ratio and len(late_high_priority) > 3:
            # ACTION: Shift tasks to next sprint
            SprintAI.reschedule_late_tasks(sprint_id, late_high_priority)
            return "Delay detected. 3 High-priority tasks moved to next sprint."

        # 2. Member Overload (Scenario: AI recommends reducing workload)
        member_workload = {}
        for t in tasks:
            member_workload[t.assigned_to] = member_workload.get(t.assigned_to, 0) + t.points

        overburdened = [m for m, load in member_workload.items() if load > 20] # 20pt limit
        if overburdened:
            # ACTION: Reallocate resources
            SprintAI.reallocate_tasks(sprint_id, overburdened)
            return f"Workload adjusted for members: {', '.join(overburdened)}"