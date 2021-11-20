let LobbyBase = require('./LobbyBase.js');
let GameLobbySettings = require('./GameLobbySettings.js');
let Connection = require('../Connection.js');

module.exports = class GameLobby extends LobbyBase {
    playerCount = 1;
    constructor(settings = GameLobbySettings) {
        super();
        this.settings = settings;
    }

    onUpdate() {
        let lobby = this;
    }

    canEnterLobby(connection = Connection) {
        let lobby = this;
        console.log(this.lobby);
        let maxPlayerCount = lobby.settings.maxPlayers;
        let currentPlayerCount = lobby.connections.length;

        if (currentPlayerCount + 1 > maxPlayerCount) {
            return false;
        }

        return true;
    }

    // onEnterLobby(connection = Connection) {
    //     let lobby = this;
    //     let connections = lobby.connections;
    //     let socket = connection.socket;
    //     const io = connection.io;
    //     super.onEnterLobby(connection);
    //     // console.log(connection.lobby.connections.length);
    //     // console.log(connection.lobby.settings.maxPlayer);
    //     const players = this.connections.map(c => c.player).map(c => {
    //         return {
    //             id: c.id,
    //             name: c.username,
    //             readyStatus : c.ready,
    //         }
    //     });
    //     console.log(players);
    //     io.in(lobby.id).emit('waitingForPlayer', {
    //         player: players,
    //         playerLength : players.length,
    //         playerCount: this.settings.maxPlayers,     
    //     });

    //     // socket.on('waitingForPlayer', res => {
    //     //     console.log(res);
    //     // });
    //     connections.forEach(c => {
    //         // if (c.player.id != connection.player.id) {
    //         socket.emit('debugLog', {
    //             id: c.player.id,
    //         });
    //         socket.to(lobby.id).emit('debugLog', {
    //             id: c.player.id,
    //         });
    //         // }
    //     });

    //     // TODO buat dan pindahkan code dibawah function start match
    //     if (connection.lobby.connections.length == connection.lobby.settings.maxPlayers) {
    //         console.log('Ini Gan Hasilnya');
    //         lobby.spawnPlayers(connection);
    //     }
    // }

    onEnterLobby(connection = Connection) {
        let lobby = this;
        let connections = lobby.connections;
        let socket = connection.socket;
        const io = connection.io;
        super.onEnterLobby(connection);
        // console.log(connection.lobby.connections.length);
        // console.log(connection.lobby.settings.maxPlayer);
        const players = this.connections.map(c => c.player).map(c => {
            return {
                id: c.id,
                type: c.type,
            }
        });
        console.log(players);
        lobby.spawnPlayers(connection);
        // io.in(lobby.id).emit('waitingForPlayer', {
        //     player: players,
        //     playerLength : players.length,
        //     playerCount: this.settings.maxPlayers,     
        // });

        // socket.on('waitingForPlayer', res => {
        //     console.log(res);
        // });
        // connections.forEach(c => {
        //     // if (c.player.id != connection.player.id) {
        //     socket.emit('debugLog', {
        //         id: c.player.id,
        //     });
        //     socket.to(lobby.id).emit('debugLog', {
        //         id: c.player.id,
        //     });
        //     // }
        // });

        // TODO buat dan pindahkan code dibawah function start match
        // if (connection.lobby.connections.length == connection.lobby.settings.maxPlayers) {
        //     console.log('Ini Gan Hasilnya');
        //     lobby.spawnPlayers(connection);
        // }
    }

    onLeaveLobby(connection = Connection) {
        let lobby = this;

        super.onLeaveLobby(connection);

        lobby.removePlayer(connection);
    }

    // spawnPlayers(connection = Connection) {
    //     let lobby = this;
    //     let connections = lobby.connections;
    //     let socket = connection.socket;
    //     const io = connection.io;
    //     let maxPlayer = lobby.settings.maxPlayers;
    //     let werewolf = 0;
    //     werewolf = Math.round((maxPlayer - 1) / 4);
    //     // TODO create randomize function for player type, and spaw location
    //     let spawnedWerewolf = 0;
    //     function spawning(c, index) {
    //         let rand = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
    //         if (spawnedWerewolf == werewolf) {
    //             c.player.generateNewType(0);      
    //         } else if (spawnedWerewolf < werewolf) {
    //             if(rand == 0) {
    //                 c.player.generateNewType(0); 
    //             } else if (rand == 1) {
    //                 c.player.generateNewType(1);
    //                 spawnedWerewolf++; 
    //             }
    //         }
    //         if(spawnedWerewolf < werewolf && (werewolf - spawnedWerewolf) < (maxPlayer - (index+1))) {
    //             c.player.generateNewType(1);   
    //             spawnedWerewolf++;              
    //         }
    //         const data = {
    //             id: c.player.id,
    //             type: c.player.type,
    //             spawnLoc: c.player.spawnLoc,
    //         };
    //         io.in(lobby.id).emit('spawn', data);
    //     }

    //     connections.forEach(spawning);
    // }

    // spawnPlayers() {
    //     let lobby = this;
    //     let connections = lobby.connections;

    //     connections.forEach(connection => {
    //         lobby.spawnPlayersProcess(connection);
    //     });
    // }

    spawnPlayers(connection = Connection) {
        let lobby = this;
        let connections = lobby.connections;
        let socket = connection.socket;
        const io = connection.io;
        let maxPlayer = lobby.settings.maxPlayers;
        let werewolf = 0;
        werewolf = Math.round((maxPlayer - 1) / 4);
        // TODO create randomize function for player type, and spaw location
        let spawnedWerewolf = 0;
        // function spawning(c, index) {
        //     let rand = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
        //     if (spawnedWerewolf == werewolf) {
        //         c.player.generateNewType(0);      
        //     } else if (spawnedWerewolf < werewolf) {
        //         if(rand == 0) {
        //             c.player.generateNewType(0); 
        //         } else if (rand == 1) {
        //             c.player.generateNewType(1);
        //             spawnedWerewolf++; 
        //         }
        //     }
        //     if(spawnedWerewolf < werewolf && (werewolf - spawnedWerewolf) < (maxPlayer - (index+1))) {
        //         c.player.generateNewType(1);   
        //         spawnedWerewolf++;              
        //     }
        //     const data = {
        //         id: c.player.id,
        //         type: c.player.type,
        //         spawnLoc: c.player.spawnLoc,
        //     };
        //     io.in(lobby.id).emit('spawn', data);
        // }

        // connections.forEach(spawning);
        const data = {
                    id: connection.player.id,
                    name: connection.player.username,
                    type: connection.player.type,
                    idLobby: connection.lobby.id,
                    serverID: connection.player.serverID
                };
        console.log('emit spawn here')
        socket.emit('spawn', data);
        socket.broadcast.to(lobby.id).emit('spawn', data);
        connections.forEach(c => {
            if(c.player.id != connection.player.id) {
                socket.emit('spawn', {
                    id: c.player.id,
                    name: c.player.username,
                    type: c.player.type,
                    idLobby: c.lobby.id,
                    serverID: connection.player.serverID
                });
            }
        });
    }

    removePlayer(connection = Connection) {
        let lobby = this;

        connection.socket.broadcast.to(lobby.id).emit('disconnected', {
            id: connection.player.id,
        });
    }
};
