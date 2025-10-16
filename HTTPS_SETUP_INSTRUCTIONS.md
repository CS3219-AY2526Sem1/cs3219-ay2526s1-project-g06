# HTTPS Self-Signed Certificate Setup Instructions

## Summary
This guide sets up HTTPS using a self-signed certificate on your EC2 backend. Users will see a browser warning about the certificate, but it will fix the mixed content error and allow your frontend to communicate with the backend.

## ⚠️ Important Note
Self-signed certificates will show a browser security warning. Users need to:
1. Click "Advanced" or "Details"
2. Click "Proceed to 16.176.159.10 (unsafe)" or similar
This is normal for self-signed certificates and acceptable for development/class projects.

---

## Step 1: SSH into EC2 and Generate Certificate

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/peerprep-key.pem ubuntu@16.176.159.10

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate (valid for 365 days)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt \
  -subj "/C=SG/ST=Singapore/L=Singapore/O=PeerPrep/CN=16.176.159.10"

# Verify certificate was created
ls -la /etc/nginx/ssl/
```

You should see:
- `nginx-selfsigned.key` (private key)
- `nginx-selfsigned.crt` (certificate)

---

## Step 2: Deploy Updated Configuration

The following files have been updated locally:
- ✅ `nginx.conf` - Now supports HTTPS on port 443
- ✅ `services/user/.env` - CORS updated to CloudFront HTTPS
- ✅ `services/matching/.env` - CORS updated to CloudFront HTTPS
- ✅ `frontend/peerprep-web/.env.production` - API base updated to HTTPS

### Deploy to EC2

```bash
# Commit and push changes
git add nginx.conf services/user/.env services/matching/.env frontend/peerprep-web/.env.production
git commit -m "Add HTTPS support with self-signed certificate"
git push origin master
```

The CI/CD pipeline will automatically deploy to EC2.

---

## Step 3: Update GitHub Secrets

Go to: `https://github.com/CS3219-AY2526Sem1/project-g06/settings/secrets/actions`

Update the following secret:
- **`VITE_API_BASE`**: Change from `http://16.176.159.10` to `https://16.176.159.10`

---

## Step 4: Verify Deployment

After the CI/CD completes:

### 4.1 Check nginx is running with HTTPS
```bash
ssh -i ~/.ssh/peerprep-key.pem ubuntu@16.176.159.10
cd /home/ubuntu/cs3219-ay2526s1-project-g06
docker-compose ps
```

### 4.2 Test HTTPS endpoint
```bash
curl -k https://16.176.159.10/health
```

Should return: `OK`

---

## Step 5: Test Frontend

1. Visit: `https://d34n3c7d9pxc7j.cloudfront.net/login`
2. Open browser DevTools (F12) → Console
3. You should no longer see the "Mixed Content" error
4. Try logging in

### If you see certificate warnings:
- **Chrome**: Click "Advanced" → "Proceed to 16.176.159.10 (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "visit this website"

---

## Troubleshooting

### Mixed content error still appears
- Make sure GitHub Secret `VITE_API_BASE` is `https://16.176.159.10`
- Check browser console for the exact URL being called
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### "Connection refused" or timeout
```bash
# Check nginx is listening on port 443
ssh -i ~/.ssh/peerprep-key.pem ubuntu@16.176.159.10
sudo netstat -tlnp | grep 443
```

If not listening:
```bash
# Check nginx container logs
docker-compose logs nginx

# Restart containers
docker-compose restart
```

### CORS errors
Make sure backend `.env` files have been updated on EC2:
```bash
ssh -i ~/.ssh/peerprep-key.pem ubuntu@16.176.159.10
cd /home/ubuntu/cs3219-ay2526s1-project-g06

# Check user service .env
cat services/user/.env | grep CORS_ORIGIN
# Should show: CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net

# Check matching service .env
cat services/matching/.env | grep CORS_ORIGIN
# Should show: CORS_ORIGIN=https://d34n3c7d9pxc7j.cloudfront.net
```

If not correct, the CI/CD should update them on next deployment.

---

## Security Notice

⚠️ **Self-signed certificates are NOT recommended for production!**

For a production deployment, consider:
1. Getting a domain name ($5-10/year)
2. Using Let's Encrypt (free, trusted by browsers)
3. Or using AWS Certificate Manager with CloudFront

This self-signed certificate is acceptable for:
- ✅ Class projects and demos
- ✅ Development/testing
- ✅ Internal tools
- ❌ Public-facing production apps
- ❌ Apps handling sensitive data

---

## Next Steps After Testing

Once you verify HTTPS is working:

1. Test all functionality:
   - Login/Register
   - Profile management
   - Matching service (WebSocket)
   - Question service

2. Ask teammates to test and accept the certificate warning

3. Document in your README that users need to accept the certificate warning

4. Consider getting a domain if this becomes a portfolio project

---

## Files Changed

- `nginx.conf` - Added HTTPS server block with SSL configuration
- `services/user/.env` - Updated CORS_ORIGIN
- `services/matching/.env` - Updated CORS_ORIGIN
- `frontend/peerprep-web/.env.production` - Updated VITE_API_BASE to HTTPS
- GitHub Secret: `VITE_API_BASE` - Needs manual update to `https://16.176.159.10`

---

## Quick Reference Commands

```bash
# SSH into EC2
ssh -i ~/.ssh/peerprep-key.pem ubuntu@16.176.159.10

# Check container status
docker-compose ps

# View nginx logs
docker-compose logs nginx

# Restart services
docker-compose restart

# Test HTTPS (ignore cert warning)
curl -k https://16.176.159.10/health
```
