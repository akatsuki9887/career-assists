FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system deps for faiss and torch
RUN apt-get update && apt-get install -y gcc g++ && apt-get clean

# Copy requirements and install deps (caching ke liye pehle copy)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port (Railway ya Fly.io $PORT use karega)
EXPOSE $PORT

# Environment vars for single worker (RAM save)
ENV UVICORN_WORKERS=1
ENV PORT=8080

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT", "--workers", "1"]