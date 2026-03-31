#!/bin/bash

# Frontend deployment script to S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh

set -e

echo "🚀 Starting frontend deployment..."

# Variables - REPLACE THESE
S3_BUCKET="peerprep-cs3219-g06"
CLOUDFRONT_DISTRIBUTION_ID="E1LGYQN97JEUV9"
REGION="ap-southeast-1"

# Build frontend
echo "📦 Building frontend..."
cd frontend/peerprep-web
npm run build

# Upload to S3
echo "☁️  Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete --region $REGION

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Frontend deployment complete!"
echo "🌐 Your site will be live at your CloudFront URL in a few minutes"
