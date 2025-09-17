# Base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies (needed for compilation)
RUN apt-get update && apt-get install -y gcc g++ curl git && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Upgrade pip and install all dependencies
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Expose port (Railway/Render sets $PORT automatically)
EXPOSE 8080

# Environment variables
ENV UVICORN_WORKERS=1
ENV PORT=8080

# Start command (entrypoint)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
