module.exports = class Connection {
    constructor() {
        this.socket;
        this.player;
        this.server;
        this.lobby;
    }

    createEvents() {
        let connection = this;
        let socket = connection.socket;
        let server = connection.server;
        let player = connection.player;

        socket.on('disconnect', function () {
            server.onDisconnected(connection);
        });

        socket.on('joinLobby', (data) => {
            // console.log(data);
            if (data.name && data.idLobby && data.type) {
                server.onJoinLobby(connection, data);
            } else {
                socket.emit('errorPesan');
            }

        });

        socket.on('createLobby', (data) => {
            // server.onCreateLobby(connection, data);
            // socket.emit('suksesLogin');
            const axios = require('axios')
            if (data.name && data.password) {
                axios
                    .post('http://103.181.142.138:8000/login-game', {
                        username: data.name,
                        password: data.password
                    })
                    .then(res => {
                        socket.emit('suksesLogin');
                        console.log('sukses')
                        data.serverID = res.data.id;
                        data.serverName = res.data.name;
                        data.idGuru = res.data.username;
                        server.onCreateLobby(connection, data);
                        console.log(data)
                    })
                    .catch(error => {
                        console.log(error)
                        socket.emit('gagalLogin');
                        console.log("Error Login")
                    })
            } else if (!data.name || !data.password) {
                console.log("error");
                socket.emit('gagalLogin');
            }
        });

        socket.on('raiseHand', function (data) {
            console.log('test raise hand');
            socket.broadcast.to(connection.lobby.id).emit('raiseHand', player);
            // socket.emit('raiseHand');
            console.log('test raise hand2');
        });

        socket.on('globalMute', function (data) {
            console.log('mute global');
            socket.broadcast.to(connection.lobby.id).emit('globalMute');
        });

        socket.on('openWhiteboard', function (data) {
            console.log('open whiteboard');
            connection.lobby.settings.whiteboard = true;

            socket.emit('openWhiteboard');
            socket.broadcast.to(connection.lobby.id).emit('openWhiteboard');
        });

        socket.on('closeWhiteboard', function (data) {
            console.log('close whiteboard');
            connection.lobby.settings.whiteboard = false;

            socket.emit('closeWhiteboard');
            socket.broadcast.to(connection.lobby.id).emit('closeWhiteboard');
        });

        socket.on('clearWhiteboard', function (data) {
            console.log('clear whiteboard');
            connection.lobby.settings.whiteboardData = '';

            socket.emit('clearWhiteboard');
            socket.broadcast.to(connection.lobby.id).emit('clearWhiteboard');
        });

        socket.on('drawWhiteboard', function (data) {
            console.log('drawing data');
            server.onDrawWhiteboard(connection, data);
        });

        socket.on('showWhiteboard', function (data) {
            console.log('showing whiteboard data');
            socket.emit('showWhiteboard', connection.lobby.settings.whiteboardData);
        });

        socket.on('wbChange', function (data) {
            console.log('change whiteboard privilege');
            console.log(data)
            connection.lobby.settings.whiteboardID = data;

            socket.emit('wbChange', {data: connection.lobby.settings.whiteboardID});
            socket.broadcast.to(connection.lobby.id).emit('wbChange', {data: connection.lobby.settings.whiteboardID});
        });

        socket.on('checkState', function (data) {
            console.log('check state data');

            let dataCompile = {
                whiteboard : connection.lobby.settings.whiteboard ? 1 : 0,
                whiteboardID : connection.lobby.settings.whiteboardID,
                whiteboardData : connection.lobby.settings.whiteboardData,
                shapeData : connection.lobby.settings.whiteboardData,
                textData : connection.lobby.settings.whiteboardData
            }

            socket.emit('checkState', {data: dataCompile});
        });

        socket.on('textWhiteboard', function (data) {
            console.log('text data');

            connection.lobby.settings.textData = data;
            socket.broadcast.to(connection.lobby.id).emit('textWhiteboard', data);
        });

        socket.on('shapeWhiteboard', function (data) {
            console.log('shape data');

            connection.lobby.settings.shapeData = data;
            socket.broadcast.to(connection.lobby.id).emit('shapeWhiteboard', data);
        });

        socket.on('buatDiskusi', (data) => {
            server.onSwitchLobbyDiskusi(connection, data);
        });

        socket.on('moveToDiskusi', (data) => {
            // console.log('data ' + data)
            server.onMoveToDiskusi(connection, data);
        });

        socket.on('moveRuangan', (data) => {
            // console.log('data ' + data)
            server.onMoveRuangan(connection, data);
        });

        socket.on('returnToKelas', (data) => {
            server.onReturnToKelas(connection, data);
        });

        socket.on('updatePosition', function (data) {
            player.position.x = data.position.x;
            player.position.y = data.position.y;

            try {
                socket.broadcast.to(connection.lobby.id).emit('updatePosition', player);
            } catch (error) {
                console.log(error)
                socket.emit('errorPesan');
            }

        });

        socket.on('updateKursi', function (data) {
            console.log(data)
            if (!data.isSit) {
                player.isSit = 'Null';
            } else {
                player.isSit = data.idChair;
            }
            socket.broadcast.to(connection.lobby.id).emit('updateKursi', data);
        });

        socket.on('submitSoal', function (data) {
            if (connection.lobby.settings.quiz) {
                server.onSubmitSoal(connection, data);
            } else {
                socket.emit('errorPesan');
            }
        });

        socket.on('submitJawaban', function (data) {
            server.onSubmitJawaban(connection, data);
        });

        socket.on('downloadBuku', function (data) {
            console.log(data)
            const axios = require('axios')
            axios
                .get('http://103.181.142.138:8000/download-buku/'+data)
                .then(res => {
                    socket.emit('downloadBuku', { linkBuku: res.data });
                    console.log(res.data)
                })
                .catch(error => {
                    console.log(error)
                    console.log("Error download buku")
                })
        });

        socket.on('listBuku', function (data) {
            const axios = require('axios')
            axios
            .get('http://103.181.142.138:8000/list-buku/'+data)
            .then(res => {
                socket.emit('listBuku', {daftarBuku : res.data});
                console.log(res.data)

            })
            .catch(error => {
                console.log(error)
                console.log("Error di list buku")
            })
        });

        socket.on('searchBuku', function (data) {
            const axios = require('axios')
            axios
            .get('http://103.181.142.138:8000/search-buku/'+data)
            .then(res => {
                socket.emit('searchBuku', {daftarBuku : res.data});
                console.log(res.data)

            })
            .catch(error => {
                console.log(error)
                console.log("Error di kirim soal")
            })
        });

        socket.on('playerList', function(data) {
            console.log('player list gais')

            let playersArray = [];
            
            connection.lobby.connections.forEach(element => {
                let playerObject = {
                    username: element.player.username,
                    id: element.player.id
                };

                playersArray.push(playerObject);
            });

            console.log(playersArray)
            // console.log(players)
            socket.emit('playerList', {data: playersArray});
        });


        // socket.on('disconnect', function() {

        // });
    }
};
