let Connection = require('./Connection.js');
let Player = require('./Player.js');

let GameLobby = require('./Lobbies/GameLobby.js');
let LobbyBase = require('./Lobbies/LobbyBase.js');
let GameLobbySettings = require('./Lobbies/GameLobbySettings.js');

module.exports = class Server {
    constructor() {
        this.connections = [];
        this.lobbys = [];
        this.io;
        this.generalServerID = 'General Server';
        this.startLobby = new LobbyBase();
        this.startLobby.id = this.generalServerID;
        this.lobbys[this.generalServerID] = this.startLobby;
    }

    onUpdate() {
        let server = this;

        for (let id in server.lobbys) {
            server.lobbys[id].onUpdate();
        }
    }

    onConnected(socket) {
        let server = this;
        let connection = new Connection();
        connection.socket = socket;
        connection.player = new Player();
        connection.player.lobby = server.startLobby.id;
        connection.server = this;

        let player = connection.player;
        let lobbys = server.lobbys;

        console.log('Added New Player To The Server (' + player.id + ')');
        server.connections[player.id] = connection;

        socket.join(player.lobby);
        connection.lobby = lobbys[player.lobby];
        connection.lobby.onEnterLobbyGeneral(connection);

        return connection;
    }

    onDisconnected(connection = Connection) {
        let server = this;
        let id = connection.player.id;

        delete server.connections[id];
        console.log('Player ' + connection.player.displayPlayerInformation() + ' has disconnected');

        connection.socket.broadcast.to(connection.player.lobby).emit('disconnected', {
            id: id,
        });

        //Preform lobby clean up
        let currentLobbyIndex = connection.player.lobby;
        server.lobbys[currentLobbyIndex].onLeaveLobby(connection);
        // console.log('A = ' + currentLobbyIndex + ' B = ' + server.generalServerID);
        console.log(server.lobbys);
        if (
            server.lobbys[currentLobbyIndex].id != server.generalServerID &&
            server.lobbys[currentLobbyIndex] != undefined &&
            server.lobbys[currentLobbyIndex].connections.length == 0 
        ) {
            console.log('Closing down lobby (' + currentLobbyIndex + ')');
            delete server.lobbys[currentLobbyIndex];
        }
    }

    onAttemptToJoinGame(connection = Connection) {
        let server = this;
        let lobbyFound = false;

        let gameLobbies = [];
        for (var id in server.lobbys) {
            if (server.lobbys[id] instanceof GameLobby) {
                gameLobbies.push(server.lobbys[id]);
            }
        }

        console.log('Found (' + gameLobbies.length + ') lobies in the server');

        gameLobbies.forEach(lobby => {
            if (!lobbyFound) {
                let canJoin = lobby.canEnterLobby(connection);
                // console.log('masuk lobby 0 B');
                if (canJoin) {
                    // console.log('masuk lobby 0 A');
                    lobbyFound = true;
                    server.onSwitchLobby(connection, lobby.id);
                }
            }
        });

        if (!lobbyFound) {
            console.log('make new lobby');
            const gamelobby = new GameLobby(new GameLobbySettings('Standard', 1));
            server.lobbys[gamelobby.id] = gamelobby;
            server.onSwitchLobby(connection, gamelobby.id);
        }
    }

    onTest1Gan(connection = Connection, data) {
        let server = this;
        if (data.serverID) {
            connection.player.serverID = data.serverID;
        }
        connection.player.type = 1;
        connection.player.username = data.serverName;
        console.log('make new lobby');
        let found = false;
        let idTemp = 'a';
        Object.values(server.lobbys).map(c =>  {
            if (c.settings) {
                if (c.settings.idGuru == data.idGuru) {
                    found = true;
                    idTemp = c.id;
                }
            }
        });

        if (found) {
            server.onSwitchLobby(connection, idTemp);
        } else {
            const gamelobby = new GameLobby(new GameLobbySettings('Kelas', 31, data.idGuru));
            server.lobbys[gamelobby.id] = gamelobby;
            server.onSwitchLobby(connection, gamelobby.id);
        }
        console.log(idTemp)
        console.log(found)
    }

    onTest2Gan(connection = Connection, data) {
        let server = this;
        console.log('join lobby');
        // console.log(server.lobbys)
        // console.log(connection.player)
        if (server.lobbys[data.idLobby]) {
            connection.player.type = 2;
            connection.player.username = data.name;
            server.onSwitchLobby(connection, data.idLobby);
        } else {
            connection.socket.emit('errorPesan');
        }
    }

    onSwitchLobby(connection = Connection, lobbyID) {
        const server = this;
        const lobbys = server.lobbys;

        connection.socket.join(lobbyID);
        connection.lobby = lobbys[lobbyID];

        lobbys[connection.player.lobby].onLeaveLobby(connection);
        lobbys[lobbyID].onEnterLobby(connection);
    }

    onSubmitSoal(connection = Connection, data) {
        const axios = require('axios')
        data.idLobby = connection.lobby.id;
        data.namaGuru = connection.player.username;
        data.serverID = connection.player.serverID;
        axios
            .post('http://103.121.17.201:8000/submit-soal', {
                data
            })
            .then(res => {
                //console.log(`statusCode: ${res.status}`)
                //console.log(res)
                data.kodeSoal = res.data
                console.log("Berhasil di kirim soal")
                connection.socket.broadcast.to(connection.lobby.id).emit('submitSoal', data);
            })
            .catch(error => {
                console.log(error)
                console.log("Error di kirim soal")
            })
        //console.log(connection)
        //connection.socket.broadcast.to(connection.lobby.id).emit('submitSoal', data);
    }

    onSubmitJawaban(connection = Connection, data) {
        const axios = require('axios')
        data.namaSiswa = connection.player.username;
        console.log(data)
        axios
            .post('http://103.121.17.201:8000/submit-jawaban', {
                data
            })
            .then(res => {
                //console.log(`statusCode: ${res.status}`)
                //console.log(res)
                console.log("Berhasil di kirim jawaban")
            })
            .catch(error => {
                console.log(error)
                console.log("Error di kirim jawaban")
            })
        //console.log(connection)
        //connection.socket.broadcast.to(connection.lobby.id).emit('submitSoal', data);
    }
};
