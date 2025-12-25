# deployment/Dockerfile
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_HOME=/usr/src/app

# --- CRITICAL FIX: Tell Python to look inside the 'src' folder ---
# This makes 'from controllers import...' work correctly
ENV PYTHONPATH=/usr/src/app/src

# --- 1. Install System Dependencies ---
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# --- 2. Setup Application Environment ---
WORKDIR $APP_HOME

# Copy requirements (context is project root '..')
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

# Copy the rest of the application code
COPY . $APP_HOME

# --- 3. Define Startup Command ---
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "src.app:create_app()"]