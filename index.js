let io = require('socket.io')(4000);
let Server = require('./Code/Server.js');

console.log('Server Has Started');

const server = new Server();

setInterval(
    () => {
        server.onUpdate();
    },
    100,
    0
);

io.on('connection', function (socket) {
    let connection = server.onConnected(socket);
    connection.createEvents();
    connection.socket.emit('register', { id: connection.player.id, type: connection.player.type });
});
