# CI/CD Setup Guide

This guide will help you configure GitHub Actions for automated deployment of your PeerPrep application.

## Overview

Two workflows have been created:
1. **deploy-frontend.yml** - Deploys React app to S3 + CloudFront
2. **deploy-backend.yml** - Deploys backend services to EC2

## Prerequisites

- GitHub repository: `CS3219-AY2526Sem1/cs3219-ay2526s1-project-g06`
- AWS account with appropriate permissions
- EC2 instance running with SSH access
- S3 bucket and CloudFront distribution already set up

---

## Step 1: Configure GitHub Secrets

Go to your GitHub repository:
```
Settings → Secrets and variables → Actions → New repository secret
```

### AWS Credentials

| Secret Name | Value | How to Get It |
|-------------|-------|---------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | AWS Console → IAM → Users → Security Credentials → Create Access Key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | Generated when you create the access key above |
| `AWS_REGION` | `ap-southeast-1` | Your AWS region (Singapore) |

**IAM Permissions Required:**
- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` for your S3 bucket
- `cloudfront:CreateInvalidation` for your CloudFront distribution

### S3 & CloudFront

| Secret Name | Value |
|-------------|-------|
| `S3_BUCKET` | `peerprep-cs3219-g06` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1LGYQN97JEUV9` |
| `CLOUDFRONT_DOMAIN` | `d34n3c7d9pxc7j.cloudfront.net` |

### EC2 Configuration

| Secret Name | Value | How to Get It |
|-------------|-------|---------------|
| `EC2_HOST` | `16.176.159.10` | Your EC2 public IP address |
| `EC2_USER` | `ubuntu` | Your EC2 SSH username |
| `EC2_SSH_KEY` | Contents of `peerprep-keypair.pem` | See instructions below |

**How to get EC2_SSH_KEY:**
```bash
# On your local machine where you have the key
cat ~/.ssh/peerprep-keypair.pem

# Copy the ENTIRE output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... (all the lines)
# -----END RSA PRIVATE KEY-----
```

### Frontend Environment Variables

| Secret Name | Value |
|-------------|-------|
| `VITE_API_BASE` | `http://16.176.159.10` |
| `VITE_BACKEND_URL` | `http://16.176.159.10` |
| `VITE_FB_API_KEY` | `AIzaSyBISVLB8G-lBojMMPTwRlDdAeWj4nzZyho` |
| `VITE_FB_AUTH_DOMAIN` | `peerprep-b71e2.firebaseapp.com` |
| `VITE_FB_PROJECT_ID` | `peerprep-b71e2` |
| `VITE_FB_STORAGE_BUCKET` | `peerprep-b71e2.firebasestorage.app` |
| `VITE_FB_MESSAGING_SENDER_ID` | `306461560451` |
| `VITE_FB_APP_ID` | `1:306461560451:web:bfdb092fadaacd56cf15b6` |
| `VITE_FB_MEASUREMENT_ID` | `G-NG48P4SYZT` |

**Note:** Firebase keys are client-side keys and are safe to be in your build. We store them as secrets for easy rotation.

---

## Step 2: Verify GitHub Secrets

After adding all secrets, you should have **19 secrets** total:

**AWS (3):**
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

**S3/CloudFront (3):**
- S3_BUCKET
- CLOUDFRONT_DISTRIBUTION_ID
- CLOUDFRONT_DOMAIN

**EC2 (3):**
- EC2_HOST
- EC2_USER
- EC2_SSH_KEY

**Frontend Env (10):**
- VITE_API_BASE
- VITE_BACKEND_URL
- VITE_FB_API_KEY
- VITE_FB_AUTH_DOMAIN
- VITE_FB_PROJECT_ID
- VITE_FB_STORAGE_BUCKET
- VITE_FB_MESSAGING_SENDER_ID
- VITE_FB_APP_ID
- VITE_FB_MEASUREMENT_ID

---

## Step 3: Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. If prompted, click "I understand my workflows, go ahead and enable them"
3. You should see two workflows:
   - Deploy Frontend to S3/CloudFront
   - Deploy Backend to EC2

---

## Step 4: Test the Workflows

### Test Frontend Deployment

1. Go to **Actions** → **Deploy Frontend to S3/CloudFront**
2. Click **Run workflow** → Select `master` branch → **Run workflow**
3. Wait for the workflow to complete (should take 2-3 minutes)
4. Check the deployment summary for the CloudFront URL
5. Verify your site is live at: https://d34n3c7d9pxc7j.cloudfront.net

### Test Backend Deployment

1. Go to **Actions** → **Deploy Backend to EC2**
2. Click **Run workflow** → Select `master` branch → **Run workflow**
3. Wait for the workflow to complete (should take 1-2 minutes)
4. Check the logs to see if services started successfully
5. Verify services at: http://16.176.159.10

---

## How CI/CD Works

### Automatic Triggers

**Frontend Deployment** runs automatically when you push to `master` and:
- Any file in `frontend/` directory changes
- The workflow file itself changes

**Backend Deployment** runs automatically when you push to `master` and:
- Any file in `services/` directory changes
- `docker-compose.yml` changes
- `nginx.conf` changes
- The workflow file itself changes

### Manual Triggers

Both workflows can also be triggered manually:
1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. Choose branch (usually `master`)
5. Click **Run workflow** button

---

## Deployment Process

### Frontend Deployment Flow
```
1. Checkout code from GitHub
2. Setup Node.js environment
3. Install dependencies (npm ci)
4. Build React app with environment variables
5. Upload to S3 bucket
6. Invalidate CloudFront cache
7. Show deployment summary
```

### Backend Deployment Flow
```
1. Checkout code from GitHub
2. Setup SSH connection to EC2
3. SSH into EC2 instance
4. Navigate to project directory
5. Pull latest code (git pull)
6. Stop running containers
7. Rebuild and start containers
8. Verify services are running
9. Show logs and deployment summary
```

---

## Monitoring Deployments

### View Deployment Status
- Go to **Actions** tab to see all workflow runs
- Green checkmark = successful deployment
- Red X = failed deployment (check logs for details)

### View Deployment Logs
- Click on any workflow run
- Click on the job name (e.g., "deploy")
- Expand each step to see detailed logs

### Deployment Summaries
Each successful deployment shows a summary with:
- Deployment time
- Commit hash
- Service URLs
- Test endpoints

---

## Troubleshooting

### Frontend Deployment Fails

**"Error: Access Denied" when uploading to S3**
- Check AWS credentials are correct
- Verify IAM user has S3 permissions
- Ensure S3 bucket name is correct

**"Error: InvalidationBatch" CloudFront error**
- Check CloudFront distribution ID is correct
- Verify AWS credentials have CloudFront permissions

**Build fails with environment variable errors**
- Check all VITE_* secrets are set correctly
- Ensure no typos in secret names

### Backend Deployment Fails

**"Permission denied (publickey)" SSH error**
- Check EC2_SSH_KEY contains the complete private key
- Ensure key includes BEGIN and END lines
- Verify EC2_HOST and EC2_USER are correct

**"Connection refused" to EC2**
- Check EC2 security group allows SSH (port 22) from GitHub IPs
- Verify EC2 instance is running
- Check EC2_HOST IP is correct

**Docker containers fail to start**
- SSH into EC2 manually and check logs: `docker-compose logs`
- Verify .env files exist on EC2 with correct values
- Check if ports 4001, 4002, 4003 are available

**Services not responding after deployment**
- Wait 30 seconds for services to fully start
- Check nginx configuration is correct
- Verify MongoDB Atlas allows EC2 IP address

---

## Security Best Practices

1. **Rotate AWS Keys Regularly**
   - Create new access keys every 90 days
   - Update GitHub secrets with new keys
   - Delete old keys from AWS

2. **Limit IAM Permissions**
   - Only grant minimum required permissions
   - Use separate IAM user for CI/CD
   - Don't use root AWS account

3. **Protect SSH Keys**
   - Never commit SSH keys to Git
   - Only store in GitHub Secrets
   - Rotate EC2 key pairs periodically

4. **Environment Variables**
   - Backend secrets stay on EC2 (not in GitHub)
   - Only frontend public values in GitHub Secrets
   - Never commit .env files with real secrets

5. **Monitor Workflows**
   - Review workflow run logs regularly
   - Set up GitHub notifications for failures
   - Check AWS CloudWatch for service health

---

## Cost Considerations

### GitHub Actions
- **Free tier**: 2,000 minutes/month for public repos
- **Free tier**: 500 MB storage for artifacts
- These workflows should stay well within free tier

### AWS Costs
- S3 storage and requests: ~$1/month
- CloudFront data transfer: ~$1-2/month
- EC2 t2.micro: ~$15/month
- **Total**: ~$17-20/month (no change from current setup)

---

## Advanced: Preview Deployments (Future Enhancement)

To deploy PR branches to a test environment:

1. Create a new workflow: `.github/workflows/deploy-preview.yml`
2. Set up a separate S3 bucket for previews
3. Deploy each PR to `s3://bucket/pr-<number>/`
4. Add comment to PR with preview URL

This is optional and can be added later.

---

## Need Help?

**Workflow not triggering?**
- Check the `paths` configuration in the workflow file
- Ensure you're pushing to the `master` branch
- Verify GitHub Actions is enabled for the repository

**Deployment taking too long?**
- Frontend: 2-5 minutes is normal (includes build + upload)
- Backend: 1-3 minutes is normal (includes Docker build)
- CloudFront cache invalidation can take 5-10 minutes to propagate globally

**Want to skip CI/CD for a commit?**
Add `[skip ci]` to your commit message:
```bash
git commit -m "Update README [skip ci]"
```

---

## Summary Checklist

Before your first deployment, ensure:

- [ ] All 19 GitHub Secrets are configured
- [ ] AWS IAM user has correct permissions
- [ ] EC2 instance is running and accessible
- [ ] EC2 has the repository cloned at `/home/ubuntu/cs3219-ay2526s1-project-g06`
- [ ] EC2 has .env files configured for all services
- [ ] GitHub Actions is enabled for the repository
- [ ] You've tested manual workflow runs successfully

---

## Next Steps

1. Add all GitHub Secrets (Step 1)
2. Test manual deployments (Step 4)
3. Push changes to `master` to test automatic deployment
4. Monitor your first few deployments to ensure everything works
5. Enjoy automated deployments! 🎉

For questions or issues, check the workflow logs in the Actions tab.
