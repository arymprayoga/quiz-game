module.exports = {
    apps: [{
        name: 'quiz-game',
        script: 'index.js',
        instances: 1,
        exec_mode: 'fork',

        // Environment variables
        env: {
            NODE_ENV: 'development',
            PORT: 4000,
            HEALTH_PORT: 4001
        },

        env_production: {
            NODE_ENV: 'production',
            PORT: 4000,
            HEALTH_PORT: 4001,
            PUBLIC_HOST: process.env.SSH_HOST || '103.59.95.207'
        },

        // Process management
        watch: false,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',

        // Logging
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Resource limits
        max_memory_restart: '500M',

        // Advanced settings
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 10000,

        // Health check
        health_check_grace_period: 3000
    }],

    deploy: {
        production: {
            user: 'ubuntu',
            host: process.env.SSH_HOST || '103.59.95.207',
            ref: 'origin/main',
            repo: 'git@github.com:arymprayoga/quiz-game.git',
            path: '/var/www/quiz-game',
            'pre-deploy-local': '',
            'post-deploy': 'npm ci --production && pm2 reload ecosystem.config.js --env production',
            'pre-setup': ''
        }
    }
};
