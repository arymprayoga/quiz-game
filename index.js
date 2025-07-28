const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer);

let Server = require('./Code/Server.js');

// Initialize error handling and logging
require('./Code/ErrorHandler');
const logger = require('./Code/Logger');

logger.info('Quiz Game Server starting up', {
    port: 4000,
    nodeVersion: process.version,
    platform: process.platform
});

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'quiz-game-admin-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use('/admin/public', express.static(path.join(__dirname, 'Code/Admin/public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
const apiRoutes = require('./Code/Admin/routes/api');
app.use('/api', apiRoutes);

// Admin routes
const adminRoutes = require('./Code/Admin/routes/admin');
app.use('/admin', adminRoutes);

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/admin/');
});

const server = new Server();

// Start health monitoring endpoint
const HealthMonitor = require('./Code/HealthMonitor');
const healthMonitor = new HealthMonitor(4001);
healthMonitor.start();

// Update loop removed for performance - using event-driven architecture instead

io.on('connection', function (socket) {
    const ErrorHandler = require('./Code/ErrorHandler');
    
    try {
        let connection = server.onConnected(socket);
        connection.createEvents();
        connection.socket.emit('register', { id: connection.player.id, type: connection.player.type });
        
        logger.info('Player connected', {
            playerId: connection.player.id,
            playerType: connection.player.type,
            socketId: socket.id
        });
    } catch (error) {
        ErrorHandler.handleSocketError(error, socket, {
            event: 'connection',
            component: 'main'
        });
    }
});

// Start the HTTP server
httpServer.listen(4000, () => {
    logger.info('Quiz Game Server listening on port 4000');
    console.log('🎮 Quiz Game Server started on port 4000');
    console.log('📊 Admin panel available at http://localhost:4000/admin/');
    console.log('❤️  Health monitor on port 4001');
});
