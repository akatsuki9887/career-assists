FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies (gcc g++ + cleanup)
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Railway/Fly.io will set PORT env automatically
ENV UVICORN_WORKERS=1
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
