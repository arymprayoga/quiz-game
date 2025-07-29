#!/bin/bash

# Quiz Game Server Deployment Script for Ubuntu 24.04
# This script sets up the server environment and deploys the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="quiz-game"
APP_DIR="/var/www/quiz-game"
NGINX_SITE="quiz-game"
NODE_VERSION="18"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    log "Node.js installed: $node_version"
    log "npm installed: $npm_version"
}

# Install PM2
install_pm2() {
    log "Installing PM2 globally..."
    sudo npm install -g pm2
    
    # Setup PM2 startup script
    pm2 startup | grep -E '^sudo' | sh || true
    
    log "PM2 installed: $(pm2 --version)"
}

# Install Nginx
install_nginx() {
    log "Installing Nginx..."
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    log "Nginx installed and started"
}

# Setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create app directory
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    
    # Create logs directory
    mkdir -p $APP_DIR/logs
    
    # Create persistent database directory
    sudo mkdir -p /var/lib/quiz-game
    sudo chown -R $USER:$USER /var/lib/quiz-game
    
    log "Application directory created: $APP_DIR"
    log "Database directory created: /var/lib/quiz-game"
}

# Clone repository
clone_repository() {
    log "Cloning repository..."
    
    if [ -d "$APP_DIR/.git" ]; then
        log "Repository already exists, pulling latest changes..."
        cd $APP_DIR
        git pull origin main
    else
        log "Cloning fresh repository..."
        git clone https://github.com/arymprayoga/quiz-game.git $APP_DIR
        cd $APP_DIR
    fi
}

# Install application dependencies
install_dependencies() {
    log "Installing application dependencies..."
    cd $APP_DIR
    npm ci --production
    log "Dependencies installed"
}

# Setup Nginx configuration
setup_nginx() {
    log "Setting up Nginx configuration..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    # Main application
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Socket.IO specific
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_buffering off;
    }
    
    # Health monitoring endpoint
    location /health {
        proxy_pass http://localhost:4001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Metrics endpoint
    location /metrics {
        proxy_pass http://localhost:4001/metrics;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /admin/public/ {
        alias $APP_DIR/Code/Admin/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    log "Nginx configured and reloaded"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH, HTTP, and HTTPS
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    
    # Allow application ports (for direct access if needed)
    sudo ufw allow 4000/tcp comment 'Quiz Game App'
    sudo ufw allow 4001/tcp comment 'Quiz Game Health Monitor'
    
    log "Firewall configured"
}

# Start application
start_application() {
    log "Starting application with PM2..."
    
    cd $APP_DIR
    
    # Stop existing processes
    pm2 stop $APP_NAME || true
    pm2 delete $APP_NAME || true
    
    # Start application
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    log "Application started with PM2"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check main application port
    if curl -f http://localhost:4000/ > /dev/null 2>&1; then
        log "✅ Main application is responding on port 4000"
    else
        error "❌ Main application is not responding on port 4000"
        pm2 logs $APP_NAME --lines 20
        return 1
    fi
    
    # Check health monitor
    if curl -f http://localhost:4001/health > /dev/null 2>&1; then
        log "✅ Health monitor is responding on port 4001"
    else
        warning "⚠️  Health monitor is not responding on port 4001"
    fi
    
    # Check Nginx
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log "✅ Nginx is proxying requests successfully"
    else
        error "❌ Nginx is not working properly"
        sudo nginx -t
        return 1
    fi
    
    log "🎉 All health checks passed!"
}

# Main deployment function
main() {
    log "Starting Quiz Game Server deployment on Ubuntu 24.04..."
    
    check_root
    
    # Check if this is initial setup or update
    if command -v node > /dev/null 2>&1 && command -v pm2 > /dev/null 2>&1; then
        log "Detected existing installation, performing update..."
        
        # Ensure database directory exists
        sudo mkdir -p /var/lib/quiz-game
        sudo chown -R $USER:$USER /var/lib/quiz-game
        
        clone_repository
        install_dependencies
        start_application
        health_check
    else
        log "Performing initial server setup..."
        
        update_system
        install_nodejs
        install_pm2
        install_nginx
        setup_app_directory
        clone_repository
        install_dependencies
        setup_nginx
        setup_firewall
        start_application
        health_check
    fi
    
    log "🚀 Deployment completed successfully!"
    log "📊 Application URL: http://your-server-ip/"
    log "❤️  Health Monitor: http://your-server-ip/health"
    log "📈 Metrics: http://your-server-ip/metrics"
}

# Run main function
main "$@"