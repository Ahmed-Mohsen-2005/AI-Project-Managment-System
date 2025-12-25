"""Debug test to check what's in the models"""

def test_check_user_model():
    """Check what's actually in user.py"""
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
    
    try:
        import models.user as user_module
        print("\n=== USER MODULE CONTENTS ===")
        print([x for x in dir(user_module) if not x.startswith('_')])
        
        # Try to find the class
        for name in dir(user_module):
            obj = getattr(user_module, name)
            if isinstance(obj, type):
                print(f"Found class: {name}")
        
        assert True
    except Exception as e:
        print(f"Error: {e}")
        assert False

def test_check_project_model():
    """Check what's actually in project.py"""
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
    
    try:
        import models.project as project_module
        print("\n=== PROJECT MODULE CONTENTS ===")
        print([x for x in dir(project_module) if not x.startswith('_')])
        
        for name in dir(project_module):
            obj = getattr(project_module, name)
            if isinstance(obj, type):
                print(f"Found class: {name}")
        
        assert True
    except Exception as e:
        print(f"Error: {e}")
        assert False
