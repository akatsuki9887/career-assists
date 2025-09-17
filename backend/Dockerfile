# Base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for faiss, torch etc.)
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Upgrade pip and install all dependencies except torch
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt --no-deps

# Install torch separately (CPU version)
RUN pip install torch==2.2.0+cpu -f https://download.pytorch.org/whl/torch_stable.html

# Install remaining dependencies (now with deps)
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Expose port (Railway/Render sets $PORT automatically)
EXPOSE $PORT

# Environment variables
ENV UVICORN_WORKERS=1
ENV PORT=8080

# Start command (entrypoint)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
