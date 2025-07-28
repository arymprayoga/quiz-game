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

        // Initialize memory management
        const memoryManager = require('./MemoryManager');
        memoryManager.startPeriodicCleanup();

        console.log('Server initialized with enhanced memory management');
    }

    // onUpdate method removed - using event-driven architecture for better performance

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

    onDisconnected(connection) {
        const memoryManager = require('./MemoryManager');
        let server = this;
        let id = connection.player.id;

        delete server.connections[id];
        console.log('Player ' + connection.player.displayPlayerInformation() + ' has disconnected');

        // Broadcast disconnect to other players
        try {
            connection.socket.broadcast.to(connection.player.lobby).emit('disconnected', {
                id: id
            });
        } catch (error) {
            console.error('Error broadcasting disconnect:', error.message);
        }

        // Perform lobby cleanup
        let currentLobbyIndex = connection.player.lobby;
        if (server.lobbys[currentLobbyIndex]) {
            server.lobbys[currentLobbyIndex].onLeaveLobby(connection);

            // Enhanced lobby cleanup - check if lobby should be closed
            if (
                server.lobbys[currentLobbyIndex].id != server.generalServerID &&
                server.lobbys[currentLobbyIndex] != undefined &&
                server.lobbys[currentLobbyIndex].connections.length == 0
            ) {
                console.log('Closing down lobby (' + currentLobbyIndex + ')');

                // Enhanced cleanup for the lobby
                memoryManager.cleanupLobby(server.lobbys[currentLobbyIndex]);
                delete server.lobbys[currentLobbyIndex];
            }
        }

        // Enhanced player cleanup
        memoryManager.cleanupPlayer(connection.player, connection);
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
                c.settings.whiteboardID = data.idGuru;
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

    onSwitchLobbyDiskusi(connection = Connection, _data) {
        if (connection.lobby.connections.length > 1 && connection.player.type == 1) {
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
        console.log('Movetodiskusi awal');
        let connections = connection.player;
        connections.lobbyDiskusi = data;
        let obj = {};
        obj.idServer = connections.lobbyDiskusi;
        obj.idPlayer = connections.id;

        connection.socket.broadcast.to(connection.lobby.id).emit('moveToDiskusi', obj);
        console.log('Movetodiskusi ' + connections.id);
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
        console.log('Moveruangan guru');
        connection.socket.emit('moveRuangan', { hasil });
        connection.socket.broadcast.to(connection.lobby.id).emit('moveToDiskusi', obj);
    }

    onReturnToKelas(connection = Connection, _data) {
        let idKelas = connection.lobby.id;

        connection.lobby.settings.deletable = true;
        connection.lobby.settings.joinable = true;
        connection.lobby.settings.quiz = true;

        console.log('Return Kelas');
        connection.socket.emit('returnToKelas', { idKelas });
        connection.socket.broadcast.to(connection.lobby.id).emit('returnToKelas', { idKelas });
    }

    onDrawWhiteboard(connection = Connection, data) {
        connection.lobby.settings.whiteboardData = data;
        connection.socket.broadcast.to(connection.lobby.id).emit('drawWhiteboard', data);
    }

    async onSubmitSoal(connection, data) {
        const httpClient = require('./HttpClient');

        // Debug: Log the incoming data from C# client
        console.log('=== DEBUG: Incoming submitSoal data ===');
        console.log('Full data object:', JSON.stringify(data, null, 2));
        console.log('Data keys:', Object.keys(data));
        console.log('jenisSoal:', data.jenisSoal);
        console.log('soal:', data.soal);
        console.log('timer:', data.timer);
        if (data.jenisSoal === 'pilgan') {
            console.log('jawabana:', data.jawabana);
            console.log('jawabanb:', data.jawabanb);
            console.log('jawabanc:', data.jawabanc);
            console.log('jawaband:', data.jawaband);
            console.log('opsi:', data.opsi);
        }
        console.log('=====================================');

        data.idLobby = connection.lobby.id;
        data.namaGuru = connection.player.username;
        data.serverID = connection.player.serverID;

        try {
            // Handle different question types from C# client
            if (data.jenisSoal === 'pilgan') {
                // Multiple choice question - ensure all required fields are present
                if (!data.soal || !data.jawabana || !data.jawabanb || !data.jawabanc ||
                    !data.jawaband || data.opsi === undefined || !data.timer) {
                    console.log('Missing required fields for pilgan question');
                    console.log('Field check - soal:', !!data.soal, 'jawabana:', !!data.jawabana, 'jawabanb:', !!data.jawabanb);
                    console.log('Field check - jawabanc:', !!data.jawabanc, 'jawaband:', !!data.jawaband, 'opsi:', data.opsi !== undefined, 'timer:', !!data.timer);
                    connection.socket.emit('errorPesan', { message: 'Missing required fields for multiple choice question' });
                    return;
                }
                console.log('Processing pilgan question with timer:', data.timer);
            } else if (data.jenisSoal === 'essay') {
                // Essay question - ensure required fields are present
                if (!data.soal || !data.timer) {
                    console.log('Missing required fields for essay question');
                    console.log('Field check - soal:', !!data.soal, 'timer:', !!data.timer);
                    connection.socket.emit('errorPesan', { message: 'Missing required fields for essay question' });
                    return;
                }
                console.log('Processing essay question with timer:', data.timer);
            } else {
                console.log('Unknown question type:', data.jenisSoal);
                connection.socket.emit('errorPesan', { message: 'Unknown question type' });
                return;
            }

            // Format the individual question data into the quiz format expected by QuizService
            let questionObj = {
                question: data.soal,
                type: data.jenisSoal,
                timer: data.timer
            };

            if (data.jenisSoal === 'pilgan') {
                questionObj.options = [
                    data.jawabana,
                    data.jawabanb,
                    data.jawabanc,
                    data.jawaband
                ];
                questionObj.correctAnswer = data.opsi; // Keep 1-based as sent from Unity game
            }

            // Create quiz data structure for QuizService
            const quizData = {
                ...data, // Include serverID, namaGuru, idLobby
                title: `Quiz - ${data.soal.substring(0, 50)}...`, // Create title from question text
                questions: [questionObj] // Single question in array format
            };

            // Debug: Log what we're sending to the API
            console.log('=== DEBUG: Formatted quiz data for API ===');
            console.log('API payload:', JSON.stringify({ data: quizData }, null, 2));
            console.log('==========================================');

            const res = await httpClient.post('/submit-soal', { data: quizData });
            console.log('=== DEBUG: Local API Response ===');
            console.log('Response status:', res.status);
            console.log('Response data:', res.data);
            console.log('Response headers:', res.headers);
            console.log('===============================');

            data.kodeSoal = res.data;
            console.log('Berhasil di kirim soal, kodeSoal:', data.kodeSoal);
            connection.socket.broadcast.to(connection.lobby.id).emit('submitSoal', data);
        } catch (error) {
            console.log('=== DEBUG: API Error ===');
            console.log('Error details:', error.message);
            if (error.response) {
                console.log('Error status:', error.response.status);
                console.log('Error data:', error.response.data);
                console.log('Error headers:', error.response.headers);
            }
            console.log('=======================');
            console.log('Error di kirim soal');
            connection.socket.emit('errorPesan', { message: 'Failed to submit question' });
        }
    }

    async onSubmitJawaban(connection, data) {
        const httpClient = require('./HttpClient');

        // Debug: Log incoming answer data
        console.log('=== DEBUG: Incoming submitJawaban data ===');
        console.log('Full data object:', JSON.stringify(data, null, 2));
        console.log('Data keys:', Object.keys(data));
        console.log('==========================================');

        // Map client data to QuizService format
        data.namaSiswa = connection.player.username;
        data.idLobby = connection.lobby.id;

        // Fix field mapping: client sends 'id' but QuizService expects 'kodeSoal'
        if (data.id && !data.kodeSoal) {
            data.kodeSoal = data.id;
        }

        // Fix answer format: QuizService expects 'jawaban' array, client sends individual fields
        if (!data.jawaban) {
            if (data.indexJawaban !== undefined) {
                // Multiple choice answer - use indexJawaban
                data.jawaban = [{ selectedAnswer: data.indexJawaban }];
            } else if (data.jawaban !== undefined) {
                // Essay answer - use jawaban text
                data.jawaban = [{ essayAnswer: data.jawaban || 'Siswa Tidak Menjawab' }];
            } else {
                // Default empty answer
                data.jawaban = [{ selectedAnswer: null }];
            }
        }

        console.log('=== DEBUG: Formatted answer data for API ===');
        console.log('API payload:', JSON.stringify({ data }, null, 2));
        console.log('============================================');

        try {
            await httpClient.post('/submit-jawaban', { data });
            console.log('Berhasil di kirim jawaban');
        } catch (error) {
            console.log('=== DEBUG: Submit Answer Error ===');
            console.log('Error details:', error.message);
            if (error.response) {
                console.log('Error status:', error.response.status);
                console.log('Error data:', error.response.data);
            }
            console.log('=================================');
            console.log('Error di kirim jawaban');
        }
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
