module.exports = class GameLobbySettings {
    constructor(gameMode, maxPlayers, idGuru) {
        this.gameMode = gameMode;
        this.idGuru = idGuru;
        this.joinable = true;
        this.maxPlayers = maxPlayers;
        this.deletable = true;
        this.quiz = true;
    }
};
