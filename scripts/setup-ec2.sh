#!/bin/bash

# EC2 instance setup script
# Run this on your EC2 instance after SSH login

set -e

echo "🚀 Setting up EC2 instance for PeerPrep backend..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Git
echo "📚 Installing Git..."
sudo apt-get install -y git

echo "✅ EC2 setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Set up environment variables in services/*/.env files"
echo "3. Run: docker-compose up -d"
echo ""
echo "⚠️  Note: Log out and back in for docker group changes to take effect"
