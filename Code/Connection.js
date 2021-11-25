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

        socket.on('setPlayerName', (data) => {
            // server.onDisconnected(connection);
            // console.log(data);
            console.log('halo');
        });

        socket.on('testingsend', _ => {
            // server.onAttemptToJoinGame(connection);
            console.log('halo2');
        });

        socket.on('joinGame', (data) => {
            player.username = data.nama;
            console.log('test');
            connection.socket.emit('feedback', { nama: player.username, idchannel: data.kode });
            // server.onAttemptToJoinGame(connection);
        });

        socket.on('joinLobby', (data) => {
            // console.log(data);
            if (data.name && data.idLobby) {
                server.onTest2Gan(connection, data);
            } else {
                socket.emit('errorPesan');
            }

        });

        socket.on('createLobby', (data) => {
            const axios = require('axios')
            if (data.name && data.password) {
                axios
                    .post('http://103.121.17.201:8000/login-game', {
                        username: data.name,
                        password: data.password
                    })
                    .then(res => {
                        socket.emit('suksesLogin');
                        console.log('sukses')
                        data.serverID = res.data.id;
                        data.serverName = res.data.name;
                        data.idGuru = res.data.username;
                        server.onTest1Gan(connection, data);
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

        socket.on('updatePintu', function (data) {
            socket.broadcast.to(connection.lobby.id).emit('updatePintu', data);
            // console.log(server.connections);
        });

        socket.on('playerReady', function (data) {
            // socket.broadcast.to(connection.lobby.id).emit('updatePintu', data);
            console.log(server.connections);
        });

        socket.on('killPlayer', function (data) {
            socket.broadcast.to(connection.lobby.id).emit('killPlayer', data);
            console.log(data.id);
        });

        socket.on('updatePosition', function (data) {
            player.position.x = data.position.x;
            player.position.y = data.position.y;

            // var d = {
            //     id = player.id,
            //     position = {
            //         x = player.position.x,
            //         y = player.position.y
            //     }
            // }

            socket.broadcast.to(connection.lobby.id).emit('updatePosition', player);
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
            server.onSubmitSoal(connection, data)
            // console.log("awal");
            // console.log("halo soal");
            // socket.broadcast.to(connection.lobby.id).emit('submitSoal', data);
        });

        socket.on('submitJawaban', function (data) {
            server.onSubmitJawaban(connection, data)
            // console.log(data);
            // console.log("halo jawaban");
            // socket.broadcast.to(connection.lobby.id).emit('submitSoal', data);
        });

        socket.on('listBuku', function (data) {
            // const axios = require('axios')
            // axios
            // .get('http://103.121.17.201:8000/list-buku')
            // .then(res => {
            //     //console.log(`statusCode: ${res.status}`)
            //     //console.log(res)
            //     // const listBuku = res.data.map(item => {
            //     //     return {
            //     //         namaSiswa: item.namaSiswa,
            //     //         jawabanSiswa : item.jawabanSiswa
            //     //     }
            //     // });
            //     socket.emit('listBuku', {daftarBuku : res.data});
            //     console.log(res.data)

            // })
            // .catch(error => {
            //     console.log(error)
            //     console.log("Error di kirim soal")
            // })

            const arrayBuku = [{
                "judulBuku": "How to Get a Girl",
                "linkBuku": "https://drive.google.com/file/d/1yTISArlbhM_gnjpI8Iw8Rda2PiBReu32/view?usp=sharing",
            },
            {
                "judulBuku": "Test Gan",
                "linkBuku": "https://drive.google.com/file/d/1yTISArlbhM_gnjpI8Iw8Rda2PiBReu32/view?usp=sharing",
            }]
            socket.emit('listBuku', { daftarBuku: arrayBuku });

            // console.log(arrayBuku);

        });


        // socket.on('disconnect', function() {

        // });
    }
};
