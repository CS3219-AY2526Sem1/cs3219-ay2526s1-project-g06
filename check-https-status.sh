#!/bin/bash
# Quick script to check HTTPS setup status on EC2

echo "=== Checking SSL Certificates ==="
if [ -f /etc/nginx/ssl/nginx-selfsigned.crt ]; then
  echo "✅ Certificate exists"
  ls -lh /etc/nginx/ssl/
else
  echo "❌ Certificate NOT found at /etc/nginx/ssl/"
fi

echo ""
echo "=== Checking Docker Containers ==="
docker-compose ps

echo ""
echo "=== Nginx Container Logs (last 20 lines) ==="
docker-compose logs --tail=20 nginx

echo ""
echo "=== Testing nginx config ==="
docker-compose exec nginx nginx -t 2>&1 || echo "Cannot test config - container not running"

echo ""
echo "=== Checking ports ==="
sudo netstat -tlnp | grep -E ':(80|443) ' || echo "Ports 80/443 not listening"
