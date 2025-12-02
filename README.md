
# **AIPMS (AI Project Management System)**

### **Advanced AI Project Management Platform 🚀**

AIPMS is a next-generation, all-in-one **AI-powered project management and DevOps platform** built to outperform tools like **Jira**, **ClickUp**, and **Asana**.
It uses advanced AI models, a scalable SOA architecture, and intelligent automation to manage the entire project lifecycle.

---

### **✨ Key AI Features**

### **AI Project Planning & Automation**

* **AI Project Blueprint Generation (FR-101)** — Generates a WBS and schedule from a natural language prompt.
* **AI Contextual Priority Scoring (FR-201)** — Dynamically ranks tasks based on dependency importance, stakeholder impact, and urgency.
* **AI Resource Load Balancing (FR-301)** — Predicts overload and recommends optimal task reassignment.

### **AI Team Intelligence**

* **Predictive Swarm Assignment (FR-202)** — Suggests a temporary "swarm team" to resolve urgent tasks efficiently.
* **Sentiment Analysis Engine (FR-503)** — Produces a **Team Stress Index** from communication logs.

### **Bidirectional Communication**

AIPMS integrates with Slack and other platforms to let users execute actions such as:
**Escalate Task**, **Reassign**, **Update Status**, and more.

---

### **⚙️ Architecture Overview**

### **Architectural Style**

* **Service-Oriented Architecture (SOA)**
* **Model-View-Controller (MVC)**
* **Event-Driven Messaging via Kafka**

### **Technology Stack**

| Layer          | Technology              | Purpose                       |
| -------------- | ----------------------- | ----------------------------- |
| **Frontend**   | HTML / CSS / JS         | Responsive UI templates       |
| **Backend**    | Python (Flask)          | REST APIs + business logic    |
| **Database**   | SQL Server              | Transactional storage         |
| **AI/ML**      | PyTorch / TensorFlow    | AI model training & inference |
| **Deployment** | Docker / Kubernetes     | Scalable containers           |

---

### **🛠️ Local Installation & Setup**

This setup assumes access to a **shared SQL Server instance**.

### **Prerequisites**

* **Python 3.8+**
* **SQL Server ODBC Driver 17+**
* **Valid DB credentials**

---

### **1. Clone the Repository**

```bash
git clone https://github.com/Ahmed-Mohsen-2005/AI-Project-Managment-System.git
cd AI-Project-Managment-System
```

---

### **2. Create Virtual Environment & Install Packages**

```bash
python3 -m venv venv
source venv/bin/activate      # macOS/Linux
venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

Required packages: **flask**, **sqlalchemy**, **pyodbc**, **python-dotenv**

---

### **3. Configure `.env` File**

Create a `.env` file in the root directory:

```
DB_HOST=YOUR_CENTRAL_SERVER_IP_OR_HOSTNAME
DB_PORT=1433
DB_NAME=project_sentinel_db
DB_USER=your_dev_username
DB_PASSWORD=your_secure_dev_password

ODBC_DRIVER="ODBC Driver 17 for SQL Server"

SECRET_KEY=A_very_long_and_secure_secret_key_12345
```

⚠️ **Do not commit the `.env` file.**

---

### **4. Start the Application**

```bash
python src/app.py
```

---

### **5. Access the Application**

* **Home Page:** [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
* **API Root Example:** [http://127.0.0.1:5000/api/v1/users](http://127.0.0.1:5000/api/v1/users)

---

### **🗂️ Project Structure**

```
src/
├── config/             # App configuration
├── controllers/        # Routing logic (API controllers)
├── services/           # Business logic (AI, tasks, users)
├── repositories/       # CRUD database operations
├── models/             # SQLAlchemy ORM models
├── data/               # DB session management
├── clients/            # Slack/GitHub integrations
├── templates/          # HTML frontend views
└── app.py              # Application entry point
```

---

### **📌 Future Enhancements**

* CI/CD pipeline
* AI risk anomaly detection
* Multilingual work assistant
* Graph-based dependency visualization
* Automated documentation generation
