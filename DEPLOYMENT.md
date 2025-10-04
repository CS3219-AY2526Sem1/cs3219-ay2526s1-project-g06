# AWS Deployment Guide

## Architecture Overview

```
┌─────────────────────┐
│   CloudFront CDN    │ ← HTTPS, Global CDN
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│    S3 Bucket        │ ← Static React App
│  (Frontend)         │
└─────────────────────┘

┌─────────────────────┐
│   EC2 Instance      │ ← Backend Services
│   (t3.small/medium) │
├─────────────────────┤
│  Nginx (Port 80)    │ ← Reverse Proxy
│  User Service       │
│  Matching Service   │
└─────────────────────┘

┌─────────────────────┐
│   MongoDB Atlas     │ ← Database (Already set up)
└─────────────────────┘

┌─────────────────────┐
│   Firebase Auth     │ ← Authentication (Already set up)
└─────────────────────┘
```

## Prerequisites

1. **AWS Account** with CLI configured
2. **AWS CLI** installed: `aws configure`
3. **Domain name** (optional, but recommended)

## Step 1: Deploy Frontend to S3 + CloudFront

### 1.1 Create S3 Bucket and Setup
```bash
./scripts/setup-s3-cloudfront.sh peerprep-frontend-prod
```

### 1.2 Create CloudFront Distribution

1. Go to AWS Console → CloudFront → Create Distribution
2. **Origin Settings:**
   - Origin Domain: `peerprep-frontend-prod.s3-website-us-east-1.amazonaws.com`
   - Protocol: HTTP only (S3 website endpoint)
3. **Default Cache Behavior:**
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
4. **Settings:**
   - Price Class: Use only North America and Europe (cheaper)
   - Alternate Domain Names: your-domain.com (if you have one)
   - SSL Certificate: Request from ACM or use default CloudFront cert
5. **Custom Error Pages:**
   - Add 403 → /index.html (200 response)
   - Add 404 → /index.html (200 response)
   (This is for React Router to work)

### 1.3 Update Environment Variables

Edit `frontend/peerprep-web/.env.production`:
```env
VITE_API_BASE=https://api.your-ec2-ip-or-domain.com
VITE_MATCHING_WS=wss://api.your-ec2-ip-or-domain.com
```

### 1.4 Deploy Frontend
```bash
# Update S3_BUCKET and CLOUDFRONT_DISTRIBUTION_ID in the script first
./scripts/deploy-frontend.sh
```

## Step 2: Deploy Backend to EC2

### 2.1 Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. **Choose AMI:** Ubuntu Server 22.04 LTS
3. **Instance Type:** t3.small (2 vCPU, 2 GB RAM) - ~$15/month
4. **Key Pair:** Create new or use existing for SSH
5. **Network Settings:**
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
   - Allow Custom TCP (ports 4001, 4002) from anywhere
6. **Storage:** 20 GB gp3
7. Launch instance

### 2.2 SSH into EC2 Instance
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 2.3 Setup EC2 Instance
```bash
# Copy and run the setup script
curl -O https://raw.githubusercontent.com/your-repo/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# Log out and back in for docker group to take effect
exit
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 2.4 Clone Repository
```bash
git clone https://github.com/your-repo/cs3219-project.git
cd cs3219-project
```

### 2.5 Configure Environment Variables

Create production `.env` files:

**services/user/.env:**
```env
MONGO_URL=mongodb+srv://dbUser:dbUserPassword@peer-prep.tptxv6n.mongodb.net/peerprep?retryWrites=true&w=majority&appName=peer-prep
CORS_ORIGIN=https://your-cloudfront-domain.cloudfront.net
JWT_SECRET=your-production-secret-change-this
GOOGLE_APPLICATION_CREDENTIALS=./creds/serviceAccount.json
```

**services/matching/.env:**
```env
PORT=4002
CORS_ORIGIN=https://your-cloudfront-domain.cloudfront.net
```

Copy Firebase service account credentials:
```bash
mkdir -p services/user/creds
# Upload your serviceAccount.json to this directory
```

### 2.6 Deploy Backend
```bash
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh
```

### 2.7 Verify Services
```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl http://localhost/health
```

## Step 3: Configure CORS and URLs

### 3.1 Update Firebase Console
1. Go to Firebase Console → Authentication → Settings
2. Add authorized domain: `your-cloudfront-domain.cloudfront.net`

### 3.2 Update Frontend to use EC2 Backend

Update `frontend/peerprep-web/src/pages/Dashboard.tsx`:
```typescript
// Change from localhost to production URL
socketRef.current = io("https://your-ec2-ip-or-domain.com");
```

Redeploy frontend:
```bash
./scripts/deploy-frontend.sh
```

## Step 4: (Optional) Add Custom Domain

### 4.1 Get SSL Certificate
```bash
# On EC2, install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

### 4.2 Update Route 53 (or your DNS)
- Add A record pointing `api.yourdomain.com` to EC2 IP
- Add CNAME for CloudFront distribution

## Maintenance Commands

### Update Backend
```bash
ssh ubuntu@<EC2_IP>
cd cs3219-project
./scripts/deploy-backend.sh
```

### Update Frontend
```bash
./scripts/deploy-frontend.sh
```

### View Logs
```bash
ssh ubuntu@<EC2_IP>
cd cs3219-project
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

## Cost Estimate

- **S3:** ~$1/month (storage + requests)
- **CloudFront:** ~$1-2/month (data transfer)
- **EC2 t3.small:** ~$15/month
- **Total:** ~$17-20/month

## Security Checklist

- [ ] Update JWT_SECRET to strong random value
- [ ] Restrict EC2 security group (SSH only from your IP)
- [ ] Enable AWS CloudWatch monitoring
- [ ] Set up automatic backups for MongoDB
- [ ] Use environment variables for all secrets
- [ ] Enable CloudFront logging
- [ ] Set up AWS Budget alerts

## Troubleshooting

**Frontend not loading:**
- Check CloudFront error pages configuration
- Verify S3 bucket policy allows public read
- Check browser console for CORS errors

**Backend not responding:**
- Check EC2 security groups allow ports 80, 4001, 4002
- Verify Docker containers are running: `docker-compose ps`
- Check logs: `docker-compose logs`

**Socket.IO connection fails:**
- Ensure WebSocket support in Nginx config
- Check CORS_ORIGIN in matching service .env
- Verify CloudFront allows WebSocket upgrades

**Firebase auth fails:**
- Add production domain to Firebase authorized domains
- Check Firebase API keys in .env.production
