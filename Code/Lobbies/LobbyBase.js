let Connection = require('../Connection.js');
let nanoID = require('nanoid');

module.exports = class LobbyBase {
    test = [];
    constructor() {
        const nanoid = nanoID.customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
        this.id = nanoid();
        this.connections = [];
    }

    onUpdate() {}

    onEnterLobby(connection = Connection) {
        let lobby = this;
        let player = connection.player;
        player.ready = true;
        // console.log(lobby);
        console.log('Player : ' + player.displayPlayerInformation() + ' has entered the lobby (' + lobby.id + ')');

        lobby.connections.push(connection);
        // this.test.push(connection.player.id);
        // console.log(lobby.connections);
        player.lobby = lobby.id;
        connection.lobby = lobby;
    }

    onEnterLobbyGeneral(connection = Connection) {
        let lobby = this;
        let player = connection.player;

        console.log('Player : ' + player.displayPlayerInformation() + ' has entered the lobby (' + lobby.id + ')');

        lobby.connections.push(connection);
        // this.test.push(connection.player.id);
        // console.log(lobby.connections);
        player.lobby = lobby.id;
        connection.lobby = lobby;
    }

    onLeaveLobby(connection = Connection) {
        let lobby = this;
        let player = connection.player;

        console.log('Player : ' + player.displayPlayerInformation() + ' has left the lobby (' + lobby.id + ')');

        connection.lobby = undefined;

        let index = lobby.connections.indexOf(connection);
        if (index > -1) {
            lobby.connections.splice(index, 1);
        } else {
        }
    }
};
