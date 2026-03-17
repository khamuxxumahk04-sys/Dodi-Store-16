# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Expose port (Cloud Run defaults to 8080, but respects PORT env)
EXPOSE 8080

# Environment variables for production-like behavior
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO

# Run the server
CMD ["python", "server.py"]
