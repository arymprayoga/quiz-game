const httpClient = require('../HttpClient');

class LobbyEventHandler {
    static register(socket, connection, server, player) {
        // Create lobby event
        socket.on('createLobby', async (data) => {
            if (data.name && data.password) {
                try {
                    const res = await httpClient.post('/login-game', {
                        username: data.name,
                        password: data.password
                    });
                    socket.emit('suksesLogin');
                    console.log('sukses');
                    data.serverID = res.data.id;
                    data.serverName = res.data.name;
                    data.idGuru = res.data.username;
                    server.onCreateLobby(connection, data);
                    console.log(data);
                } catch (error) {
                    console.log(error);
                    socket.emit('gagalLogin');
                    console.log("Error Login");
                }
            } else if (!data.name || !data.password) {
                console.log("error");
                socket.emit('gagalLogin');
            }
        });

        // Join lobby event
        socket.on('joinLobby', (data) => {
            if (data.name && data.idLobby && data.type) {
                server.onJoinLobby(connection, data);
            } else {
                socket.emit('errorPesan');
            }
        });

        // Discussion room management
        socket.on('buatDiskusi', (data) => {
            server.onSwitchLobbyDiskusi(connection, data);
        });

        socket.on('moveToDiskusi', (data) => {
            server.onMoveToDiskusi(connection, data);
        });

        socket.on('moveRuangan', (data) => {
            server.onMoveRuangan(connection, data);
        });

        socket.on('returnToKelas', (data) => {
            server.onReturnToKelas(connection, data);
        });

        // Player list
        socket.on('playerList', function(data) {
            console.log('player list gais');

            let playersArray = [];
            
            connection.lobby.connections.forEach(element => {
                let playerObject = {
                    username: element.player.username,
                    id: element.player.id
                };
                playersArray.push(playerObject);
            });

            console.log(playersArray);
            socket.emit('playerList', {data: playersArray});
        });
    }
}

module.exports = LobbyEventHandler;