# Deployment .env Setup Guide

## Problem
`.env` files are gitignored and not pushed to GitHub, but services need them to run on EC2.

## Solution - GitHub Secrets (Fully Automated ✅)

### How It Works
The deployment script **automatically creates all `.env` files** on every deployment using **GitHub Secrets**.

**Benefits:**
- ✅ **Fully automated** - no manual SSH needed
- ✅ **Documented** - all secrets visible in GitHub settings
- ✅ **Repeatable** - works on fresh EC2 instances automatically
- ✅ **Team-friendly** - future developers know where config comes from
- ✅ **Safe** - secrets never committed to Git

### Required GitHub Secrets

Add these **two secrets** to your GitHub repository:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MONGO_URL` | User service MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/peerprep?retryWrites=true&w=majority` |
| `MONGO_URL_QUESTIONS` | Question service MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/peerprep-questions?retryWrites=true&w=majority` |

### How to Add GitHub Secrets (One-Time Setup)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add `MONGO_URL`:
   - Name: `MONGO_URL`
   - Value: Your user service MongoDB connection string
5. Add `MONGO_URL_QUESTIONS`:
   - Name: `MONGO_URL_QUESTIONS`
   - Value: Your question service MongoDB connection string

### What Gets Created on EC2

Every deployment automatically creates these files:

**`services/user/.env`**
```env
PORT=4001
CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net
MONGO_URL=<from GitHub Secret MONGO_URL>
```

**`services/matching/.env`**
```env
PORT=4002
CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net
```

**`services/question/.env`**
```env
PORT=4003
CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net
MONGO_URL=<from GitHub Secret MONGO_URL_QUESTIONS>
```

**`services/collab/.env`**
- Reuses `services/matching/.env` (per docker-compose.yml)

### How Deployment Works

```
┌─────────────────────────────────────────────────────────┐
│ 1. Developer pushes code to GitHub                     │
│    (.env files are gitignored, NOT pushed)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. GitHub Actions Workflow Triggers                     │
│    ┌─────────────────┐      ┌────────────────────┐     │
│    │   Code Repo     │      │  GitHub Secrets    │     │
│    │   (no .env)     │      │  - MONGO_URL       │     │
│    │                 │      │  - MONGO_URL_...   │     │
│    └─────────────────┘      └────────────────────┘     │
│              │                        │                 │
│              └────────┬───────────────┘                 │
│                       ▼                                 │
│         SSH to EC2 with secrets as env vars             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. On EC2 Server:                                       │
│    a. git pull (gets code, NO .env files)               │
│    b. Deployment script creates .env files:             │
│       - Writes PORT, CORS_ORIGIN (hardcoded)            │
│       - Writes MONGO_URL (from GitHub Secrets)          │
│    c. docker-compose down                               │
│    d. docker-compose up -d --build                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Docker Containers Start                              │
│    - Read .env files from EC2                           │
│    - Services start with correct environment vars ✅    │
└─────────────────────────────────────────────────────────┘
```

### After Setup - Automatic Deployments

Once GitHub Secrets are configured:
1. **Push code** to master
2. **GitHub Actions runs automatically**
3. **`.env` files created on EC2** from secrets
4. **Services restart** with updated code
5. **Done!** No manual intervention needed

### Updating MongoDB URLs

If you need to change MongoDB connection strings:
1. Update the GitHub Secret in repository settings
2. Push any change to trigger deployment (or manually trigger workflow)
3. New `.env` files will be created with updated values

### Troubleshooting

**Deployment fails with "MONGO_URL undefined":**
- Check that `MONGO_URL` and `MONGO_URL_QUESTIONS` secrets exist in GitHub
- Verify secret names match exactly (case-sensitive)

**Service won't start after deployment:**
```bash
# SSH into EC2
ssh -i ~/.ssh/peerprep-key.pem ubuntu@<EC2_HOST>
cd /home/ubuntu/cs3219-ay2526s1-project-g06

# Check if .env files were created
ls -la services/user/.env services/matching/.env services/question/.env

# View .env contents
cat services/user/.env

# Check container logs
docker-compose logs user-service
docker-compose logs question-service
```

**Verify secrets are passed correctly:**
- Check GitHub Actions logs for the deployment run
- Look for "✓ Created services/user/.env" messages
