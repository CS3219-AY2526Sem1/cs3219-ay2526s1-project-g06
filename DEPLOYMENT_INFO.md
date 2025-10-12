# PeerPrep Deployment Information

Last Updated: 2025-10-12

## Production URLs

### Current Working URL
- **Full Application (HTTP)**: http://16.176.159.10
  - Serves both frontend and backend
  - Login works ✅
  - Matching works ✅
  - Use this URL for all features

### CloudFront URL (Limited Functionality)
- **Frontend Only (HTTPS)**: https://d34n3c7d9pxc7j.cloudfront.net
  - ⚠️ **Login does NOT work** - Mixed content blocked by browser
  - ⚠️ **Matching does NOT work** - WebSocket connections blocked
  - Only use for viewing static frontend

### Backend API (Direct Access)
- **API Endpoint**: http://16.176.159.10
  - User Service: Port 4001
  - Matching Service: Port 4002

## AWS Infrastructure

### Frontend (S3 + CloudFront)
- **S3 Bucket**: `peerprep-cs3219-g06`
- **Region**: ap-southeast-1 (Singapore)
- **CloudFront Distribution ID**: E1LGYQN97JEUV9
- **CloudFront Domain**: d34n3c7d9pxc7j.cloudfront.net

### Backend (EC2)
- **Instance ID**: i-07ab937213d787b80
- **Instance Type**: t2.micro
- **Region**: ap-southeast-2 (Sydney)
- **Public IP**: 16.176.159.10
- **Key Pair**: peerprep-keypair.pem (located in ~/.ssh/)

### Running Services
- **User Service**: Port 4001
- **Matching Service**: Port 4002
- **Nginx Proxy**: Port 80, 443
- **Question Service**: Not running (stub implementation only)

## Deployment Commands

### Deploy Frontend
```bash
./scripts/deploy-frontend.sh
```
This will:
1. Build the React app
2. Upload to S3
3. Invalidate CloudFront cache

### Deploy Backend
SSH into EC2 instance:
```bash
ssh -i ~/.ssh/peerprep-keypair.pem ubuntu@16.176.159.10
cd cs3219-ay2526s1-project-g06
./scripts/deploy-backend.sh
```

### Manual Backend Update
```bash
ssh -i ~/.ssh/peerprep-keypair.pem ubuntu@16.176.159.10
cd cs3219-ay2526s1-project-g06
git pull origin master
docker-compose down
docker-compose up -d --build
docker-compose ps
```

## Environment Configuration

### Backend Services
Environment files are located on EC2 at:
- `/home/ubuntu/cs3219-ay2526s1-project-g06/services/user/.env`
- `/home/ubuntu/cs3219-ay2526s1-project-g06/services/matching/.env`
- `/home/ubuntu/cs3219-ay2526s1-project-g06/services/question/.env`

Key environment variables:
- `MONGO_URL`: MongoDB Atlas connection string
- `CORS_ORIGIN`: http://d34n3c7d9pxc7j.cloudfront.net
- `JWT_SECRET`: Production secret
- `GOOGLE_APPLICATION_CREDENTIALS`: Firebase service account path

## Monitoring & Maintenance

### Check Service Status
```bash
ssh -i ~/.ssh/peerprep-keypair.pem ubuntu@16.176.159.10
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f [service-name]
# Example: docker-compose logs -f user-service
```

### Restart Services
```bash
docker-compose restart [service-name]
# or restart all:
docker-compose restart
```

## Known Issues & Limitations

### HTTP vs HTTPS Problem
The current deployment uses HTTP only. This creates limitations:

1. **CloudFront (HTTPS) Cannot Work with HTTP Backend**
   - CloudFront serves frontend over HTTPS
   - Backend services run on HTTP (no SSL certificate)
   - Browsers block "mixed content" (HTTPS page loading HTTP resources)
   - Result: Login and matching features don't work on CloudFront URL

2. **Current Workaround**
   - Use EC2 direct URL (http://16.176.159.10) for full functionality
   - Both frontend and backend served over HTTP from same origin
   - No mixed content issues

3. **To Fix (Future Enhancement)**
   - Install SSL certificate on EC2 (using Let's Encrypt/Certbot)
   - Configure nginx to serve HTTPS on port 443
   - Update backend services to run over HTTPS
   - Then CloudFront HTTPS URL will work properly

### Other Known Issues

1. **Question Service**: Currently has only stub implementation (single import statement). Service is stopped to prevent restart loops. Nginx config has question service endpoints commented out.

2. **Docker Compose Version Warning**: The version field in docker-compose.yml is deprecated but doesn't affect functionality.

3. **Nginx DNS Caching**: When backend services restart, they get new internal IPs. Nginx caches old IPs and needs to be restarted after backend service restarts.
   ```bash
   docker-compose restart user-service matching-service
   docker-compose restart nginx  # Required after backend restart
   ```

4. **Environment Mode**: Running in development mode (NODE_ENV=development) to allow non-secure cookies over HTTP. Change to production mode only after adding HTTPS.

## Cost Estimate
- S3 Storage + Requests: ~$1/month
- CloudFront Data Transfer: ~$1-2/month
- EC2 t2.micro: ~$15/month
- **Total**: ~$17-20/month

## Security Notes
- EC2 security group allows ports 22, 80, 443, 4001, 4002
- SSH access requires peerprep-keypair.pem key
- MongoDB uses Atlas cloud service with connection string authentication
- Frontend uses Firebase for authentication
