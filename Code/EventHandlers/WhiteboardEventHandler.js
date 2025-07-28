const eventThrottler = require('../EventThrottler');

class WhiteboardEventHandler {
    static register(socket, connection, server, player) {
        // Open whiteboard
        socket.on('openWhiteboard', function (data) {
            console.log('open whiteboard');
            connection.lobby.settings.whiteboard = true;

            socket.emit('openWhiteboard');
            socket.broadcast.to(connection.lobby.id).emit('openWhiteboard');
        });

        // Close whiteboard
        socket.on('closeWhiteboard', function (data) {
            console.log('close whiteboard');
            connection.lobby.settings.whiteboard = false;

            socket.emit('closeWhiteboard');
            socket.broadcast.to(connection.lobby.id).emit('closeWhiteboard');
        });

        // Clear whiteboard
        socket.on('clearWhiteboard', function (data) {
            console.log('clear whiteboard');
            connection.lobby.settings.whiteboardData = '';

            socket.emit('clearWhiteboard');
            socket.broadcast.to(connection.lobby.id).emit('clearWhiteboard');
        });

        // Draw on whiteboard (throttled)
        socket.on('drawWhiteboard', function (data) {
            const throttleKey = `whiteboard_${connection.player.id}`;
            
            console.log('drawing data');
            
            // Throttle whiteboard drawing to prevent spam (max 20 draws/second)
            eventThrottler.throttle(throttleKey, () => {
                server.onDrawWhiteboard(connection, data);
            }, 50); // 50ms throttle
        });

        // Show whiteboard
        socket.on('showWhiteboard', function (data) {
            console.log('showing whiteboard data');
            socket.emit('showWhiteboard', connection.lobby.settings.whiteboardData);
        });

        // Change whiteboard privilege
        socket.on('wbChange', function (data) {
            console.log('change whiteboard privilege');
            console.log(data);
            connection.lobby.settings.whiteboardID = data;

            socket.emit('wbChange', {data: connection.lobby.settings.whiteboardID});
            socket.broadcast.to(connection.lobby.id).emit('wbChange', {data: connection.lobby.settings.whiteboardID});
        });

        // Check whiteboard state
        socket.on('checkState', function (data) {
            console.log('check state data');

            let dataCompile = {
                whiteboard : connection.lobby.settings.whiteboard ? 1 : 0,
                whiteboardID : connection.lobby.settings.whiteboardID,
                whiteboardData : connection.lobby.settings.whiteboardData,
                shapeData : connection.lobby.settings.whiteboardData,
                textData : connection.lobby.settings.whiteboardData
            };

            socket.emit('checkState', {data: dataCompile});
        });

        // Text on whiteboard
        socket.on('textWhiteboard', function (data) {
            console.log('text data');

            connection.lobby.settings.textData = data;
            socket.broadcast.to(connection.lobby.id).emit('textWhiteboard', data);
        });

        // Shapes on whiteboard
        socket.on('shapeWhiteboard', function (data) {
            console.log('shape data');

            connection.lobby.settings.shapeData = data;
            socket.broadcast.to(connection.lobby.id).emit('shapeWhiteboard', data);
        });
    }
}

module.exports = WhiteboardEventHandler;