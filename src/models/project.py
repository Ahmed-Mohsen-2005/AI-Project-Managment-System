class Project:
    # Update the __init__ arguments to include github_repo
    def __init__(self, project_id=None, name=None, description=None, 
                 start_date=None, end_date=None, budget=None, 
                 owner_id=None, created_at=None, github_repo=None):  # <--- Add this!
        
        self.project_id = project_id
        self.name = name
        self.description = description
        self.start_date = start_date
        self.end_date = end_date
        self.budget = budget
        self.owner_id = owner_id
        self.created_at = created_at
        
        # ✅ Add the new field
        self.github_repo = github_repo
        
    def to_dict(self):
        """Helper method to convert object to dictionary (useful for JSON responses)"""
        return {
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'start_date': str(self.start_date) if self.start_date else None,
            'end_date': str(self.end_date) if self.end_date else None,
            'budget': self.budget,
            'github_repo': self.github_repo
        }