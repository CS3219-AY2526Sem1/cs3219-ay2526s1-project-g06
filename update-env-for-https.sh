#!/bin/bash
# Script to update .env files on EC2 for HTTPS support
# This updates CORS_ORIGIN to use the CloudFront HTTPS URL

set -e

echo "📝 Updating .env files for HTTPS support..."

# Update user service .env
echo "Updating services/user/.env..."
sed -i 's|CORS_ORIGIN=http://localhost:5173|CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net|g' services/user/.env

# Update matching service .env
echo "Updating services/matching/.env..."
sed -i 's|CORS_ORIGIN=http://localhost:5173|CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net|g' services/matching/.env

echo "✅ .env files updated successfully"
echo ""
echo "Next steps:"
echo "1. Restart the services: docker-compose restart"
echo "2. Or redeploy: docker-compose down && docker-compose up -d --build"
