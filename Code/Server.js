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
        // let isSit = connection.player.isSit;

        delete server.connections[id];
        console.log('Player ' + connection.player.displayPlayerInformation() + ' has disconnected');

        connection.socket.broadcast.to(connection.player.lobby).emit('disconnected', {
            id: id,
            // isSit : isSit,
        });

        //Preform lobby clean up
        let currentLobbyIndex = connection.player.lobby;
        server.lobbys[currentLobbyIndex].onLeaveLobby(connection);
        // console.log('A = ' + currentLobbyIndex + ' B = ' + server.generalServerID);
        // console.log(server.lobbys);
        if (
            server.lobbys[currentLobbyIndex].id != server.generalServerID &&
            server.lobbys[currentLobbyIndex] != undefined &&
            server.lobbys[currentLobbyIndex].connections.length == 0
            // && server.lobbys[currentLobbyIndex].settings.deletable == true
        ) {
            console.log('Closing down lobby (' + currentLobbyIndex + ')');
            delete server.lobbys[currentLobbyIndex];
        }
    }

    onCreateLobby(connection = Connection, data) {
        let server = this;
        if (data.serverID) {
            connection.player.serverID = data.serverID;
        }
        connection.player.type = 1;
        connection.player.username = data.serverName;
        console.log('make new lobby');
        let found = false;
        let idTemp = 'a';
        Object.values(server.lobbys).map(c => {
            if (c.settings) {
                if (c.settings.idGuru == data.idGuru) {
                    found = true;
                    idTemp = c.id;
                }
            }
        });
        setTimeout(() => {
            if (found) {
                server.onSwitchLobby(connection, idTemp);
            } else {
                const gamelobby = new GameLobby(null, new GameLobbySettings('Kelas', 37, data.idGuru));
                // const gamelobby = new GameLobby(null, new GameLobbySettings('Kelas', 37, 123));
                server.lobbys[gamelobby.id] = gamelobby;
                server.onSwitchLobby(connection, gamelobby.id);
            }
        }, 2000);

    }

    onJoinLobby(connection = Connection, data) {
        let server = this;
        // console.log(server.lobbys[data.idLobby].settings.joinable);
        if (server.lobbys[data.idLobby]) {
            let canJoin = server.lobbys[data.idLobby].canEnterLobby(connection);
            if (server.lobbys[data.idLobby].settings.joinable && canJoin) {
                connection.player.type = data.type;
                connection.player.username = data.name;
                server.onSwitchLobby(connection, data.idLobby);
            } else {
                connection.socket.emit('errorPesan');
            }
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

    onSwitchLobbyDiskusi(connection = Connection, data) {
        if (connection.lobby.connections.length > 1 && connection.player.type == 1) {
            let server = this;
            let oldLobbyId = connection.lobby.id;
            let playerCount = connection.lobby.connections.length - 1;
            let connections = connection.lobby.connections;
            let pembagianDiskusi = 0;

            connection.lobby.settings.deletable = false;
            connection.lobby.settings.joinable = false;
            connection.lobby.settings.quiz = false;

            if (playerCount >= 1 && playerCount <= 6) {
                pembagianDiskusi = 1;
            } else if (playerCount >= 7 && playerCount <= 12) {
                pembagianDiskusi = 2;
            } else if (playerCount >= 13 && playerCount <= 18) {
                pembagianDiskusi = 3;
            } else if (playerCount >= 19 && playerCount <= 24) {
                pembagianDiskusi = 4;
            } else if (playerCount >= 25 && playerCount <= 30) {
                pembagianDiskusi = 5;
            } else if (playerCount >= 31 && playerCount <= 36) {
                pembagianDiskusi = 6;
            }

            connection.lobby.listDiskusi = pembagianDiskusi;

            // let shuffleArray = server.shuffle(connections);
            let shuffleArray = connections;
            let indexNewLobby = 0;
            var obj = {};
            var hasil = [];
            for (let i = 0; i < shuffleArray.length; i++) {
                if (shuffleArray[i].player.id != connection.player.id) {
                    shuffleArray[i].player.lobbyDiskusi = oldLobbyId + '-' + indexNewLobby;
                    shuffleArray[i].player.isSit = 'Null';
                    obj.idServer = oldLobbyId + '-' + indexNewLobby;
                    obj.idPlayer = shuffleArray[i].player.id;
                } else {
                    shuffleArray[i].player.lobbyDiskusi = oldLobbyId + '-0';
                    shuffleArray[i].player.isSit = 'Null';
                    obj.idServer = oldLobbyId + '-0';
                    obj.idPlayer = shuffleArray[i].player.id;
                }

                hasil[i] = obj;
                obj = {};
                indexNewLobby++;
                if (indexNewLobby == pembagianDiskusi) {
                    indexNewLobby = 0;
                }
            }
            // console.log("test");
            console.log(hasil);
            connection.socket.emit('buatDiskusi', { hasil, pembagianDiskusi });
            connection.socket.broadcast.to(connection.lobby.id).emit('buatDiskusi', { hasil, pembagianDiskusi });
        }
    }

    onMoveToDiskusi(connection = Connection, data) {
        console.log("Movetodiskusi awal");
        let connections = connection.player;
        connections.lobbyDiskusi = data;
        let obj = {};
        obj.idServer = connections.lobbyDiskusi;
        obj.idPlayer = connections.id;

        connection.socket.broadcast.to(connection.lobby.id).emit('moveToDiskusi', obj);
        console.log("Movetodiskusi " + connections.id);
    }

    onMoveRuangan(connection = Connection, data) {
        let connections = connection.player;
        connections.lobbyDiskusi = data;
        let obj = {};
        obj.idServer = connections.lobbyDiskusi;
        obj.idPlayer = connections.id;

        let connections2 = connection.lobby.connections;
        var hasil = [];
        var obj2 = {};
        for (let i = 0; i < connections2.length; i++) {
            obj2.idServer = connections2[i].player.lobbyDiskusi;
            obj2.idPlayer = connections2[i].player.id;
            obj2.position = connections2[i].player.position;
            obj2.isSit = connections2[i].player.isSit;
            hasil[i] = obj2;
            obj2 = {};
        }
        console.log("Moveruangan guru");
        connection.socket.emit('moveRuangan', { hasil });
        connection.socket.broadcast.to(connection.lobby.id).emit('moveToDiskusi', obj);
    }

    onReturnToKelas(connection = Connection, data) {
        let idKelas = connection.lobby.id;

        connection.lobby.settings.deletable = true;
        connection.lobby.settings.joinable = true;
        connection.lobby.settings.quiz = true;

        console.log('Return Kelas');
        connection.socket.emit('returnToKelas', { idKelas });
        connection.socket.broadcast.to(connection.lobby.id).emit('returnToKelas', { idKelas });
    }

    // onSwitchLobbyDiskusi(connection = Connection, data) {
    //     let server = this;
    //     let oldLobbyId = connection.lobby.id;
    //     let playerCount = connection.lobby.connections.length;
    //     let connections = connection.lobby.connections;
    //     let pembagianDiskusi = 0;

    //     connection.lobby.settings.deletable = false;
    //     connection.lobby.settings.joinable = false;

    //     if (playerCount >= 1 && playerCount <= 6) {
    //         pembagianDiskusi = 1;
    //     } else if (playerCount >= 7 && playerCount <= 12) {
    //         pembagianDiskusi = 2;
    //     } else if (playerCount >= 13 && playerCount <= 18) {
    //         pembagianDiskusi = 3;
    //     } else if (playerCount >= 19 && playerCount <= 24) {
    //         pembagianDiskusi = 4;
    //     } else if (playerCount >= 25 && playerCount <= 30) {
    //         pembagianDiskusi = 5;
    //     } else if (playerCount >= 31 && playerCount <= 36) {
    //         pembagianDiskusi = 6;
    //     }

    //     for (let index = 0; index < pembagianDiskusi; index++) {
    //         let gamelobby = new GameLobby(oldLobbyId + '-' + index, new GameLobbySettings('Diskusi', 6, 1));
    //         server.lobbys[gamelobby.id] = gamelobby;
    //     }

    //     let indexNewLobby = 0;
    //     for (let index = 0; index < playerCount; index++) {
    //         connections[index].socket.join(oldLobbyId + '-' + indexNewLobby);
    //         connections[index].lobby = lobbys[oldLobbyId + '-' + indexNewLobby];

    //         lobbys[connections[index].player.lobby].onLeaveLobby(connections[index]);
    //         lobbys[oldLobbyId + '-' + indexNewLobby].onEnterLobbyDiskusi(connections[index]);
    //         indexNewLobby++;
    //         if (indexNewLobby == pembagianDiskusi) {
    //             indexNewLobby = 0;
    //         }
    //     }

    //     // console.log(connection)
    // }

    onSubmitSoal(connection = Connection, data) {
        const axios = require('axios')
        data.idLobby = connection.lobby.id;
        data.namaGuru = connection.player.username;
        data.serverID = connection.player.serverID;
        axios
            .post('http://103.174.114.25:8000/submit-soal', {
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
            .post('http://103.174.114.25:8000/submit-jawaban', {
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

    shuffle(array) {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

};
