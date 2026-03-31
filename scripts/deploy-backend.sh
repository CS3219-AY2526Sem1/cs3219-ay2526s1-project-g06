#!/bin/bash

# Backend deployment script for EC2
# Run this on your EC2 instance to deploy/update backend services

set -e

echo "🚀 Deploying backend services..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Rebuild and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Show running containers
echo "📊 Running containers:"
docker-compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=50

echo ""
echo "✅ Backend deployment complete!"
echo "🌐 Services are running on:"
echo "   - User Service: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4001"
echo "   - Matching Service: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4002"
