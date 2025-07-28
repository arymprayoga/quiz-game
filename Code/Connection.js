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

        // Import modular event handlers
        const LobbyEventHandler = require('./EventHandlers/LobbyEventHandler');
        const WhiteboardEventHandler = require('./EventHandlers/WhiteboardEventHandler');
        const PlayerEventHandler = require('./EventHandlers/PlayerEventHandler');
        const QuizEventHandler = require('./EventHandlers/QuizEventHandler');
        const BookEventHandler = require('./EventHandlers/BookEventHandler');

        // Register all event handlers
        LobbyEventHandler.register(socket, connection, server, player);
        WhiteboardEventHandler.register(socket, connection, server, player);
        PlayerEventHandler.register(socket, connection, server, player);
        QuizEventHandler.register(socket, connection, server, player);
        BookEventHandler.register(socket, connection, server, player);
    }
};