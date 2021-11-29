var Vector2 = require('./Vector2.js');
let nanoID = require('nanoid');
module.exports = class Player {
    constructor() {
        const customDigit = nanoID.customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
        this.username = 'Default';
        this.serverID = 0;
        this.id = customDigit();
        this.position = new Vector2(0,0);
        this.spawnLoc = Math.floor(Math.random() * (1 - 0 + 1)) + 0;
        this.lobby = 0;
        this.lobbyDiskusi = 'Null';
        this.type = 99;
        this.isSit = 'Null';
    }

    displayPlayerInformation() {
        let player = this;
        return '(' + player.username + ':' + player.id + ')';
    }
};
