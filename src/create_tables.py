import mysql.connector
from src.data.db_session import get_db

def create_tables():
    print("🔌 Connecting to database...")
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        print("🔨 Creating/Verifying tables...")
        
        # --- 1. CORE TABLES ---
        
        # USERR (Base User Table)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS userr (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'User',
                type VARCHAR(50) DEFAULT 'Standard'
            )
        """)
        print(" - Table 'userr' OK.")

        # PROJECT
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project (
                project_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                budget DECIMAL(10, 2) DEFAULT 0.00
            )
        """)
        print(" - Table 'project' OK.")

        # SPRINT
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sprint (
                sprint_id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                start_date DATE,
                end_date DATE,
                velocity DECIMAL(10, 2) DEFAULT 0.00,
                status VARCHAR(50) DEFAULT 'Active',
                FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE
            )
        """)
        print(" - Table 'sprint' OK.")

        # TASK
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task (
                task_id INT AUTO_INCREMENT PRIMARY KEY,
                sprint_id INT,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'Pending',
                priority VARCHAR(50) DEFAULT 'Medium',
                estimate_hours DECIMAL(5, 2) DEFAULT 0.0,
                due_date DATE,
                created_by INT,
                assigned_id INT,
                FOREIGN KEY (sprint_id) REFERENCES sprint(sprint_id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES userr(user_id) ON DELETE SET NULL,
                FOREIGN KEY (assigned_id) REFERENCES userr(user_id) ON DELETE SET NULL
            )
        """)
        print(" - Table 'task' OK.")

        # --- 2. JOIN TABLES ---

        # USER_PROJECT
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_project (
                user_id INT,
                project_id INT,
                PRIMARY KEY (user_id, project_id),
                FOREIGN KEY (user_id) REFERENCES userr(user_id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE
            )
        """)
        print(" - Table 'user_project' OK.")

        # --- 3. FEATURE TABLES (From your new Repos) ---

        # REPORT
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS report (
                report_id INT AUTO_INCREMENT PRIMARY KEY,
                sprint_id INT,
                project_id INT,
                title VARCHAR(150),
                content TEXT,
                author VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sprint_id) REFERENCES sprint(sprint_id) ON DELETE SET NULL,
                FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE SET NULL
            )
        """)
        print(" - Table 'report' OK.")

        # NOTIFICATION
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                channel VARCHAR(50) DEFAULT 'System',
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES userr(user_id) ON DELETE CASCADE
            )
        """)
        print(" - Table 'notification' OK.")

        # NOTE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS note (
                note_id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INT NOT NULL,
                created_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES userr(user_id) ON DELETE SET NULL
            )
        """)
        print(" - Table 'note' OK.")

        # INTEGRATION
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS integration (
                integration_id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                authtoken VARCHAR(255),
                last_synced DATETIME
            )
        """)
        print(" - Table 'integration' OK.")

        # FILE_ATTACHMENT
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS file_attachment (
                file_id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT,
                filename VARCHAR(255) NOT NULL,
                file_url TEXT NOT NULL,
                file_type VARCHAR(50),
                file_size INT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                uploaded_by INT,
                FOREIGN KEY (task_id) REFERENCES task(task_id) ON DELETE CASCADE,
                FOREIGN KEY (uploaded_by) REFERENCES userr(user_id) ON DELETE SET NULL
            )
        """)
        print(" - Table 'file_attachment' OK.")

        # USER_SKILLS
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_skills (
                skill_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                skill_name VARCHAR(100) NOT NULL,
                skill_level INT DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES userr(user_id) ON DELETE CASCADE
            )
        """)
        print(" - Table 'user_skills' OK.")

        # USER_ACTIVITY (Missing from previous steps, needed for UserActivityRepo)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_activity (
                activity_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES userr(user_id) ON DELETE CASCADE
            )
        """)
        print(" - Table 'user_activity' OK.")
        
        conn.commit()
        print("✅ All tables created successfully!")
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == '__main__':
    create_tables()