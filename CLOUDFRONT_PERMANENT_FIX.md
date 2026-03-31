# CloudFront Permanent Fix - Options

## Current Issue
CloudFront is configured with S3 as origin and only allows GET/HEAD/OPTIONS methods, blocking all POST/PUT/DELETE requests (403 error).

## Option 1: Application Load Balancer (Recommended)

### Steps:
1. **Create Application Load Balancer (ALB)**
   ```bash
   # Via AWS Console or CLI
   aws elbv2 create-load-balancer \
     --name peerprep-alb \
     --subnets subnet-xxx subnet-yyy \
     --security-groups sg-xxx \
     --scheme internet-facing \
     --type application \
     --ip-address-type ipv4
   ```

2. **Create Target Group pointing to EC2**
   ```bash
   aws elbv2 create-target-group \
     --name peerprep-targets \
     --protocol HTTPS \
     --port 443 \
     --vpc-id vpc-xxx \
     --target-type instance

   aws elbv2 register-targets \
     --target-group-arn arn:aws:... \
     --targets Id=i-xxxxx  # Your EC2 instance ID
   ```

3. **Configure CloudFront to use ALB DNS as origin**
   - Origin Domain: `peerprep-alb-xxxxx.ap-southeast-1.elb.amazonaws.com`
   - Add cache behaviors for `/auth/*`, `/api/*`, `/matching/*`, `/collab/*`
   - Allow all HTTP methods

### Pros:
- ✅ CloudFront natively supports ELB as origin
- ✅ Better scalability (can add more EC2 instances)
- ✅ Health checks and auto-scaling
- ✅ SSL termination at ALB

### Cons:
- ❌ Additional cost (~$16/month for ALB)
- ❌ More complex setup

---

## Option 2: Route53 + CloudFront (Simpler)

### Steps:
1. **Create a subdomain in Route53**
   ```
   api.yourdomain.com → A record → 16.176.159.10
   ```

2. **Update CloudFront to use the subdomain**
   - Add second origin: `api.yourdomain.com`
   - Add cache behaviors for API paths pointing to this origin

### Pros:
- ✅ No additional infrastructure cost
- ✅ Simpler than ALB

### Cons:
- ❌ Requires a custom domain
- ❌ Need SSL certificate for the domain

---

## Option 3: Keep Current Setup (Temporary)

### Current Configuration:
- Frontend uses EC2 IP directly: `https://16.176.159.10`
- Bypasses CloudFront for API calls
- Works but not ideal for production

### To maintain:
```bash
# frontend/.env.production
VITE_API_BASE=https://16.176.159.10
VITE_BACKEND_URL=https://16.176.159.10

# Backend CORS
CORS_ORIGIN=https://16.176.159.10
```

### Pros:
- ✅ Works immediately
- ✅ No additional cost
- ✅ No additional setup

### Cons:
- ❌ Not using CloudFront for caching/CDN
- ❌ Exposes EC2 IP directly
- ❌ No CloudFront DDoS protection for API
- ❌ Users see self-signed certificate warning

---

## Option 4: Nginx on EC2 as Reverse Proxy (Current Best)

Since your nginx is already configured to serve both frontend and backend, you can:

1. **Deploy frontend to EC2 nginx** (alongside backend)
2. **Point CloudFront to EC2 with domain**
3. **Or skip CloudFront entirely** and use EC2 directly

### Configuration:
Your nginx already does this:
```nginx
# Frontend static files
location / {
    try_files $uri $uri/ /index.html;
}

# Backend API
location /auth { proxy_pass http://user_service; }
location /api { proxy_pass http://matching_service; }
```

### Use EC2 directly:
```bash
# Update frontend build to deploy to EC2
git push → GitHub Actions → Build → Copy dist/ to EC2 nginx
```

This is **what you're currently using** and it works!

---

## Recommendation

**For now: Keep Option 3 (EC2 direct)**
- It works
- No additional cost
- Simple to maintain

**For production: Implement Option 1 (ALB)**
- Better scalability
- CloudFront benefits
- Production-ready

**Quick win: Get a domain and use Option 2**
- ~$12/year for domain
- Professional appearance
- CloudFront + custom domain

---

## What We Changed Today

1. Updated frontend `.env.production` to use EC2 IP
2. Updated backend CORS to allow EC2 IP
3. Restarted services

Everything works now! CloudFront fix can be done later when you have:
- A custom domain, OR
- Budget for ALB
