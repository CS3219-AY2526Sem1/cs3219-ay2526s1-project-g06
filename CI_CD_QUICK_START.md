# CI/CD Quick Start Guide

## 🚀 What's Been Set Up

You now have automated deployment pipelines using GitHub Actions:

- **Frontend**: Automatically deploys to S3 + CloudFront when you push frontend changes
- **Backend**: Automatically deploys to EC2 when you push backend changes

## ⚡ Quick Setup (5 Minutes)

### 1. Add GitHub Secrets

Go to: `GitHub Repo → Settings → Secrets and variables → Actions`

Click **New repository secret** and add these **19 secrets**:

#### AWS (3 secrets):
```
AWS_ACCESS_KEY_ID          = (from AWS IAM)
AWS_SECRET_ACCESS_KEY      = (from AWS IAM)
AWS_REGION                 = ap-southeast-1
```

#### S3/CloudFront (3 secrets):
```
S3_BUCKET                  = peerprep-cs3219-g06
CLOUDFRONT_DISTRIBUTION_ID = E1LGYQN97JEUV9
CLOUDFRONT_DOMAIN          = d34n3c7d9pxc7j.cloudfront.net
```

#### EC2 (3 secrets):
```
EC2_HOST                   = 16.176.159.10
EC2_USER                   = ubuntu
EC2_SSH_KEY                = (paste content of ~/.ssh/peerprep-keypair.pem)
```

#### Frontend Environment (10 secrets):
```
VITE_API_BASE              = http://16.176.159.10
VITE_BACKEND_URL           = http://16.176.159.10
VITE_FB_API_KEY            = AIzaSyBISVLB8G-lBojMMPTwRlDdAeWj4nzZyho
VITE_FB_AUTH_DOMAIN        = peerprep-b71e2.firebaseapp.com
VITE_FB_PROJECT_ID         = peerprep-b71e2
VITE_FB_STORAGE_BUCKET     = peerprep-b71e2.firebasestorage.app
VITE_FB_MESSAGING_SENDER_ID = 306461560451
VITE_FB_APP_ID             = 1:306461560451:web:bfdb092fadaacd56cf15b6
VITE_FB_MEASUREMENT_ID     = G-NG48P4SYZT
```

### 2. Get Your AWS Access Keys

If you don't have AWS access keys yet:

1. Go to AWS Console → IAM → Users
2. Select your user (or create a new one for CI/CD)
3. Go to **Security credentials** tab
4. Click **Create access key** → Choose "Application running outside AWS"
5. Copy the Access Key ID and Secret Access Key
6. Add them to GitHub Secrets

**Required IAM Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::peerprep-cs3219-g06",
        "arn:aws:s3:::peerprep-cs3219-g06/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/E1LGYQN97JEUV9"
    }
  ]
}
```

### 3. Get Your EC2 SSH Key

```bash
# On your local machine
cat ~/.ssh/peerprep-keypair.pem

# Copy the ENTIRE output and paste as EC2_SSH_KEY secret
# Should look like:
# -----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# ... (many lines)
# -----END RSA PRIVATE KEY-----
```

### 4. Test the Workflows

#### Test Frontend Deployment:
```bash
# Go to GitHub Actions tab
# Select "Deploy Frontend to S3/CloudFront"
# Click "Run workflow" → Run workflow
# Wait ~3 minutes
# Check: https://d34n3c7d9pxc7j.cloudfront.net
```

#### Test Backend Deployment:
```bash
# Go to GitHub Actions tab
# Select "Deploy Backend to EC2"
# Click "Run workflow" → Run workflow
# Wait ~2 minutes
# Check: http://16.176.159.10
```

---

## 📝 How to Use CI/CD

### Automatic Deployment

Just push to master:

```bash
# Frontend changes
git add frontend/
git commit -m "Update homepage design"
git push origin master
# → Automatically deploys frontend to S3/CloudFront

# Backend changes
git add services/
git commit -m "Add new API endpoint"
git push origin master
# → Automatically deploys backend to EC2

# Both
git add .
git commit -m "Update frontend and backend"
git push origin master
# → Deploys both frontend and backend
```

### Manual Deployment

1. Go to **Actions** tab on GitHub
2. Select the workflow you want to run
3. Click **Run workflow**
4. Select `master` branch
5. Click **Run workflow** button

---

## 🔍 Monitoring

### View Deployment Status
- Go to **Actions** tab
- See all workflow runs with status (✓ success, ✗ failed)
- Click on any run to see detailed logs

### Check What Triggered Deployment
- In Actions tab, each run shows:
  - Which files changed
  - Commit message
  - Who pushed the changes

---

## 🎯 Workflow Triggers

### Frontend Deploys When:
- Any file in `frontend/` changes
- `.github/workflows/deploy-frontend.yml` changes
- Manual trigger

### Backend Deploys When:
- Any file in `services/` changes
- `docker-compose.yml` changes
- `nginx.conf` changes
- `scripts/deploy-backend.sh` changes
- Manual trigger

### Both DON'T Deploy When:
- Only documentation files change (README.md, etc.)
- Only unrelated files change
- Commit message contains `[skip ci]`

---

## 🐛 Troubleshooting

### "Permission denied (publickey)" error
→ EC2_SSH_KEY secret is incorrect or incomplete

### "Access Denied" to S3
→ Check AWS credentials and IAM permissions

### Frontend build fails
→ Check all VITE_* secrets are set correctly

### Backend services not starting
→ SSH into EC2 and run: `docker-compose logs`

### Deployment succeeds but site not updated
→ CloudFront cache takes 5-10 minutes to propagate globally

---

## 📊 What Happens During Deployment

### Frontend Pipeline (3-5 min):
```
✓ Checkout code
✓ Install Node.js
✓ Install dependencies
✓ Build React app with env vars
✓ Upload to S3
✓ Invalidate CloudFront cache
✓ Done! Site is live
```

### Backend Pipeline (1-3 min):
```
✓ Checkout code
✓ SSH to EC2
✓ Pull latest code
✓ Stop old containers
✓ Build new containers
✓ Start services
✓ Verify health
✓ Done! APIs are live
```

---

## 💡 Pro Tips

**Skip CI for a commit:**
```bash
git commit -m "Update README [skip ci]"
```

**Deploy specific changes:**
```bash
# Only deploy frontend
git add frontend/
git commit -m "feat: update UI"
git push

# Only deploy backend
git add services/
git commit -m "feat: add new endpoint"
git push
```

**View live logs:**
- Go to Actions tab while deployment is running
- Click on the running workflow
- Watch logs in real-time

**Rollback to previous version:**
```bash
# Method 1: Revert commit
git revert HEAD
git push

# Method 2: Re-run old workflow
# Go to Actions → Find successful old run → Re-run workflow
```

---

## ✅ Checklist Before First Deployment

- [ ] All 19 secrets added to GitHub
- [ ] AWS IAM user has correct permissions
- [ ] EC2 instance is running
- [ ] EC2 has repo at `/home/ubuntu/cs3219-ay2526s1-project-g06`
- [ ] GitHub Actions is enabled
- [ ] Tested manual workflow run

---

## 📚 Full Documentation

For detailed information, see: [.github/workflows/CI_CD_SETUP.md](.github/workflows/CI_CD_SETUP.md)

---

## 🎉 You're All Set!

Once secrets are configured:
1. Push to master
2. GitHub Actions runs automatically
3. Your app deploys
4. No manual SSH or scripts needed!

**Current Deployment URLs:**
- CloudFront (HTTPS): https://d34n3c7d9pxc7j.cloudfront.net
- EC2 Direct (HTTP): http://16.176.159.10

**Questions?** Check workflow logs in the Actions tab or see full setup guide.
