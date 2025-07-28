let LobbyBase = require('./LobbyBase.js');
let GameLobbySettings = require('./GameLobbySettings.js');
let Connection = require('../Connection.js');

module.exports = class GameLobby extends LobbyBase {
    playerCount = 1;
    constructor(id, settings = GameLobbySettings) {
        super(id);
        this.settings = settings;
    }

    // onUpdate method removed - using event-driven architecture for better performance

    canEnterLobby(connection = Connection) {
        let lobby = this;
        let maxPlayerCount = lobby.settings.maxPlayers;
        let currentPlayerCount = lobby.connections.length;

        if (currentPlayerCount + 1 > maxPlayerCount) {
            return false;
        }

        return true;
    }

    onEnterLobby(connection) {
        const memoryManager = require('../MemoryManager');
        let lobby = this;
        let socket = connection.socket;

        // Check connection limit before allowing entry
        if (!memoryManager.checkConnectionLimit(lobby, 50)) {
            socket.emit('errorPesan', { 
                message: 'Lobby is full. Maximum 50 players allowed.' 
            });
            return false;
        }

        super.onEnterLobby(connection);
        
        const players = this.connections.map(c => c.player).map(c => {
            return {
                id: c.id,
                type: c.type,
            }
        });
        
        console.log('Players in lobby:', players.length);
        lobby.spawnPlayers(connection);
        
        return true;
    }

    onLeaveLobby(connection = Connection) {
        let lobby = this;

        super.onLeaveLobby(connection);

        lobby.removePlayer(connection);
    }

    spawnPlayers(connection = Connection) {
        let lobby = this;
        let connections = lobby.connections;
        let socket = connection.socket;
        const data = {
                    id: connection.player.id,
                    name: connection.player.username,
                    type: connection.player.type,
                    idLobby: connection.lobby.id,
                    serverID: connection.player.serverID,
                    position: connection.player.position,
                    isSit: connection.player.isSit
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
                    position: c.player.position,
                    serverID: connection.player.serverID,
                    isSit: c.player.isSit
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
