# Base image with Node.js (and Python/Build tools often included or easy to add)
FROM node:18-bullseye-slim

# Install system dependencies (Python, Java, GCC, G++)
RUN apt-get update && apt-get install -y \
    python3 \
    openjdk-17-jdk-headless \
    g++ \
    gcc \
    time \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for execution
RUN useradd -m -s /bin/bash coder

# Working directory
WORKDIR /app

# Switch to non-root user
USER coder

# Keep container alive by default (overridden by pool logic)
CMD ["sleep", "infinity"]
