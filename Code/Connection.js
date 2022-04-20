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
                    .post('http://103.174.114.25:8000/login-game', {
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
                .get('http://103.174.114.25:8000/download-buku/'+data)
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
            .get('http://103.174.114.25:8000/list-buku/'+data)
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
            .get('http://103.174.114.25:8000/search-buku/'+data)
            .then(res => {
                socket.emit('searchBuku', {daftarBuku : res.data});
                console.log(res.data)

            })
            .catch(error => {
                console.log(error)
                console.log("Error di kirim soal")
            })
        });


        // socket.on('disconnect', function() {

        // });
    }
};
