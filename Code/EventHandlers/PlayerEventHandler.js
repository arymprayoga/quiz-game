const eventThrottler = require('../EventThrottler');

class PlayerEventHandler {
    static register(socket, connection, server, player) {
        // Position updates (throttled)
        socket.on('updatePosition', function (data) {
            const throttleKey = `position_${connection.player.id}`;
            
            // Update player position immediately for local state
            player.position.x = data.position.x;
            player.position.y = data.position.y;

            // Throttle broadcast to other players (max 10 updates/second)
            eventThrottler.throttle(throttleKey, () => {
                try {
                    socket.broadcast.to(connection.lobby.id).emit('updatePosition', player);
                } catch (error) {
                    console.log(error);
                    socket.emit('errorPesan');
                }
            }, 100); // 100ms throttle
        });

        // Chair/seat updates
        socket.on('updateKursi', function (data) {
            console.log(data);
            if (!data.isSit) {
                player.isSit = 'Null';
            } else {
                player.isSit = data.idChair;
            }
            socket.broadcast.to(connection.lobby.id).emit('updateKursi', data);
        });

        // Raise hand
        socket.on('raiseHand', function (data) {
            console.log('test raise hand');
            socket.broadcast.to(connection.lobby.id).emit('raiseHand', player);
            console.log('test raise hand2');
        });

        // Global mute
        socket.on('globalMute', function (data) {
            console.log('mute global');
            socket.broadcast.to(connection.lobby.id).emit('globalMute');
        });

        // Disconnect handler with cleanup
        socket.on('disconnect', function () {
            // Cleanup throttle data for this player
            eventThrottler.cleanup(`position_${connection.player.id}`);
            eventThrottler.cleanup(`whiteboard_${connection.player.id}`);
            
            server.onDisconnected(connection);
        });
    }
}

module.exports = PlayerEventHandler;