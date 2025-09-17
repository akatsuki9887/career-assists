# Base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y gcc g++ curl git && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Upgrade pip
RUN pip install --upgrade pip

# Install torch CPU version compatible with Python 3.11
RUN pip install torch==2.2.2+cpu --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies (without torch)
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Expose port
EXPOSE 8080

# Environment variables
ENV UVICORN_WORKERS=1
ENV PORT=8080

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
