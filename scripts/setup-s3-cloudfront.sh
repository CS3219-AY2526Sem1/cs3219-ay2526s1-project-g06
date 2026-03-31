#!/bin/bash

# Script to set up S3 bucket and CloudFront distribution
# Usage: ./scripts/setup-s3-cloudfront.sh your-bucket-name

set -e

BUCKET_NAME=$1
REGION="us-east-1"

if [ -z "$BUCKET_NAME" ]; then
    echo "Usage: ./setup-s3-cloudfront.sh your-bucket-name"
    exit 1
fi

echo "🪣 Creating S3 bucket: $BUCKET_NAME..."

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document index.html

# Create bucket policy for public read access
cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

# Disable block public access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "✅ S3 bucket created and configured!"
echo ""
echo "📝 Next steps:"
echo "1. Create CloudFront distribution in AWS Console:"
echo "   - Origin: $BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "   - Viewer Protocol Policy: Redirect HTTP to HTTPS"
echo "   - Default Root Object: index.html"
echo "   - Error Pages: Add custom error response for 403/404 -> /index.html (for React Router)"
echo ""
echo "2. Update scripts/deploy-frontend.sh with your CloudFront Distribution ID"
echo "3. Run: ./scripts/deploy-frontend.sh"
