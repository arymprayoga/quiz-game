class QuizEventHandler {
    static register(socket, connection, server, player) {
        // Submit quiz question
        socket.on('submitSoal', function (data) {
            if (connection.lobby.settings.quiz) {
                server.onSubmitSoal(connection, data);
            } else {
                socket.emit('errorPesan');
            }
        });

        // Submit quiz answer
        socket.on('submitJawaban', function (data) {
            server.onSubmitJawaban(connection, data);
        });
    }
}

module.exports = QuizEventHandler;