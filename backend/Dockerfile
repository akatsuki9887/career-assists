FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system deps (gcc g++ for faiss/torch)
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy requirements and install deps (without torch)
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt --no-deps

# Install torch separately from official index
RUN pip install torch==2.2.0+cpu -f https://download.pytorch.org/whl/torch_stable.html

# Install missing deps after torch
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port (Railway will use $PORT)
EXPOSE $PORT

# Env vars
ENV UVICORN_WORKERS=1
ENV PORT=8080

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
