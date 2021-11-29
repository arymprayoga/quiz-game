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
            if (data.name && data.idLobby) {
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

        socket.on('buatDiskusi', (data) => {
            server.onSwitchLobbyDiskusi(connection, data);
        });

        socket.on('moveToDiskusi', (data) => {
            console.log('data ' + data)
            server.onMoveToDiskusi(connection, data);
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
