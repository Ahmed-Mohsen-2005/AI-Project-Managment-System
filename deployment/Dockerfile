# Use an official Python runtime as a parent image
# python:3.10-slim is based on Debian/Bullseye (Debian 11)
FROM python:3.10-slim

# Set environment variables for the application
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Set the directory where the application code will live inside the container
ENV APP_HOME /usr/src/app

# --- 1. Install Core Dependencies (CRITICAL FIX FOR REPOSITORY ISSUES) ---
# FIX: Explicitly install networking and building tools first.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    unixodbc-dev \
    gcc \
    g++ \
    curl \
    gnupg \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# --- 2. Install SQL Server ODBC Driver 17 (Simplified and Stabilized) ---
# Set the DEBIAN_FRONTEND and ACCEPT_EULA variables for this step's environment.
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

RUN set -ex \
    # 2a. Add the Microsoft GPG key
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/microsoft.gpg \
    # 2b. Add the Microsoft package repository list
    && curl -fsSL https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-tools.list \
    # 2c. Update again to recognize the new repository (CRITICAL)
    && apt-get update \
    # 2d. Install the driver and tools
    && apt-get install -y msodbcsql17 mssql-tools \
    # Clean up to reduce image size
    && rm -rf /var/lib/apt/lists/*

# --- 3. Setup Application Environment ---
# Create the app directory and set it as the working directory
WORKDIR $APP_HOME

# Copy the requirements file and install Python dependencies
# This path is relative to the build context defined in docker-compose.yml (which is '..')
COPY requirements.txt .
# Install dependencies, including gunicorn (production web server)
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

# Copy the entire source code into the container
# This copies the src/ folder, deployment/, etc., from the context
COPY . $APP_HOME

# --- 4. Define Startup Command ---
# Expose the port Flask runs on
EXPOSE 5000

# Command to run the application using Gunicorn (production readiness)
# Note the path to create_app() is relative to the Python path inside the container.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "src.app:create_app()"]