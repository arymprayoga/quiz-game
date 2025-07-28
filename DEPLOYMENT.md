# Quiz Game Server Deployment Guide

This guide covers deploying the Quiz Game Server to Ubuntu 24.04 using GitHub Actions for automated CI/CD.

## Prerequisites

### Ubuntu Server Requirements
- Ubuntu 24.04 LTS
- 2GB+ RAM
- 20GB+ disk space
- SSH access with sudo privileges
- Public IP address or domain name

### GitHub Repository Setup
- Repository with deployment files
- GitHub Actions enabled
- Access to repository secrets configuration

## Deployment Methods

### Method 1: Automated GitHub Actions Deployment (Recommended)

#### 1. Server Preparation

First, prepare your Ubuntu server by running the deployment script:

```bash
# Clone the repository
git clone https://github.com/your-username/quiz-game.git
cd quiz-game

# Run the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### 2. GitHub Secrets Configuration

Configure the following secrets in your GitHub repository settings:

- **SSH_HOST**: Your server's IP address or domain
- **SSH_USERNAME**: Ubuntu username (usually `ubuntu`)
- **SSH_KEY**: Private SSH key for server access
- **SSH_PORT**: SSH port (default: 22)

To generate SSH keys:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@your-domain.com"
```

Add the public key to your server's `~/.ssh/authorized_keys` file.

#### 3. Repository Configuration

Update the following files for your deployment:

**ecosystem.config.js**: Update the repository URL
```javascript
repo: 'git@github.com:your-username/quiz-game.git',
```

**scripts/deploy.sh**: Update repository URL if needed
```bash
git clone https://github.com/your-username/quiz-game.git $APP_DIR
```

#### 4. Deploy

Push to the main branch to trigger automatic deployment:
```bash
git push origin main
```

### Method 2: Manual Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/quiz-game
sudo chown -R $USER:$USER /var/www/quiz-game

# Clone repository
git clone https://github.com/your-username/quiz-game.git /var/www/quiz-game
cd /var/www/quiz-game

# Install dependencies
npm ci --production

# Create logs directory
mkdir -p logs

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Nginx Configuration

```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/quiz-game

# Enable site
sudo ln -s /etc/nginx/sites-available/quiz-game /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=production
PORT=4000
HEALTH_PORT=4001
SESSION_SECRET=your-super-secret-session-key-here
API_BASE_URL=http://103.181.142.138:8000
```

### PM2 Configuration

The `ecosystem.config.js` file includes:
- Process management settings
- Environment variables
- Logging configuration
- Resource limits
- Health check settings

### Nginx Configuration

The `nginx.conf` file provides:
- Reverse proxy setup
- SSL/TLS ready configuration
- Static file serving
- Security headers
- CORS support for Socket.IO

## Monitoring and Maintenance

### Health Checks

The application includes built-in health monitoring:
- Main app: `http://your-server/`
- Health check: `http://your-server/health`
- Metrics: `http://your-server/metrics`

### PM2 Management

```bash
# View application status
pm2 status

# View logs
pm2 logs quiz-game

# Restart application
pm2 restart quiz-game

# Monitor real-time
pm2 monit
```

### Log Management

Logs are stored in:
- Application logs: `logs/`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`

### SSL/HTTPS Setup (Optional)

For production with SSL certificate:

1. Obtain SSL certificate (Let's Encrypt recommended):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. Update `nginx.conf` to enable HTTPS sections

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
pm2 logs quiz-game
sudo systemctl status nginx
```

**Connection issues:**
```bash
sudo ufw status
sudo netstat -tlnp | grep :4000
```

**Memory issues:**
```bash
pm2 monit
curl http://localhost:4001/memory
```

### Rollback Procedure

If deployment fails:
```bash
cd /var/www/quiz-game
git log --oneline -10
git reset --hard <previous-commit>
pm2 restart quiz-game
```

## Security Considerations

- Keep system packages updated
- Use strong SSH keys
- Configure firewall (UFW)
- Restrict metrics endpoint access
- Use HTTPS in production
- Regular backup of application data

## Performance Optimization

- Monitor memory usage with health endpoint
- Use PM2 clustering for high load
- Optimize Nginx cache settings
- Configure log rotation
- Monitor application metrics

## Support

For issues related to:
- Application errors: Check PM2 logs
- Connection issues: Check Nginx configuration
- Deployment failures: Check GitHub Actions logs
- Performance issues: Monitor health endpoints