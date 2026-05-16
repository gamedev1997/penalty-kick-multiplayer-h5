// ─── CMultiplayer.js ──────────────────────────────────────────────────────────
// Manages socket.io connection and all multiplayer state for Penalty Kick.
// Used by CMenu (mode select) and CGame (kick send / result receive).

var CMultiplayer = (function () {

    // ── Config ────────────────────────────────────────────────────────────────
    // var SERVER_URL = 'http://localhost:9560';
    var SERVER_URL = 'https://multiplayer-penalty-app.game2wins.com/';
    var MSG_TAG    = 'bgfp_msg';
    var TURN_TIMER_DURATION = 15; // seconds

    var MsgType = {
        ERROR:0, GAME_EVENT:52, USER_CONNECTED:1, USER_DISCONNECTED:2,
        PLAYER_JOIN:3, PLAYER_LEFT:4, REQUEST_ROOM_CONFIRMED:5,
        REQUEST_ROOM_REJECTED:6, KICKED:8, LEAVE_ROOM_COMPLETED:9,
        REQUEST_ROOM:20, LEAVE_ROOM:22, REQUEST_PRIVATE_ROOM:25
    };
    var Events = { GAME_START:0, PLAYER_KICK:1, PLAYER_DIVE:2, ROUND_RESULT:3, GAME_END:4, WAITING:5 };
    var Mode   = { VS_BOT:'bot', RANDOM:'random', PRIVATE:'private' };

    // ── State ─────────────────────────────────────────────────────────────────
    var socket        = null;
    var myPlayerId    = null;
    var myName        = 'Player';
    var opponentName  = 'Opponent';
    var currentMode   = null;
    var isConnected   = false;
    var shotsPerPlayer = 10;
    var currentKickerId = null;
    var timerInterval = null;
    var timeLeft = TURN_TIMER_DURATION;

    // ── Callbacks (set by CMenu / CGame) ─────────────────────────────────────
    var onWaiting         = null;   // ()
    var onRoomConfirmed   = null;   // (data)
    var onRoomRejected    = null;   // (errorCode)
    var onGameStart       = null;   // (data)
    var onRoundResult     = null;   // (data)
    var onGameEnd         = null;   // (data)
    var onOpponentLeft    = null;   // ()
    var onOnlineCount     = null;   // (count)
    var onTimerTick       = null;   // (timeLeft)
    var onTurnTimeout     = null;   // ()

    // ── Public API ────────────────────────────────────────────────────────────
    function connect(playerName) {
        myName = playerName || 'Player';
        if (socket && socket.connected) return;
        socket = io(SERVER_URL, { transports: ['polling', 'websocket'] });
        socket.on('connect', function () { isConnected = true; });
        socket.on('disconnect', function () { isConnected = false; });
        socket.on('connect_error', function (err) { console.error('Socket connect_error:', err); });
        socket.on('connect_timeout', function () { console.error('Socket connect_timeout'); });
        socket.on('reconnect_failed', function () { console.error('Socket reconnect_failed'); });
        socket.on(MSG_TAG, _onServerMessage);
    }

    function connectForLobby() {
        connect(myName);
    }

    function requestBot() {
        currentMode = Mode.VS_BOT;
        _send(MsgType.REQUEST_ROOM, { playerName: myName, mode: Mode.VS_BOT });
    }

    function requestRandom() {
        currentMode = Mode.RANDOM;
        _send(MsgType.REQUEST_ROOM, { playerName: myName, mode: Mode.RANDOM });
    }

    function createPrivateRoom(code) {
        currentMode = Mode.PRIVATE;
        _send(MsgType.REQUEST_PRIVATE_ROOM, { playerName: myName, roomCode: code, isCreator: true });
    }

    function joinPrivateRoom(code) {
        currentMode = Mode.PRIVATE;
        _send(MsgType.REQUEST_PRIVATE_ROOM, { playerName: myName, roomCode: code, isCreator: false });
    }

    // kickData = { direction, angle, power, targetY }
    function sendKick(kickData) {
        stopTimer();
        var dir = (typeof kickData === 'string') ? kickData : (kickData.direction || 'center');
        _send(MsgType.GAME_EVENT, {
            event: Events.PLAYER_KICK,
            direction: dir,      // keep top-level for server compat
            kickData:  kickData  // full object for animation replay
        });
    }

    function sendTurnTimeout() {
        stopTimer();
        // Auto-miss: send a random direction (server will handle)
        var dirs = ['left', 'center', 'right'];
        var randomDir = dirs[Math.floor(Math.random() * dirs.length)];
        _send(MsgType.GAME_EVENT, { event: Events.PLAYER_KICK, direction: randomDir });
    }

    function leaveRoom() {
        stopTimer();
        _send(MsgType.LEAVE_ROOM);
        myPlayerId = null;
        currentKickerId = null;
    }

    function isMyTurn() {
        return currentKickerId == myPlayerId;
    }

    function startTimer() {
        stopTimer();
        if (!isMyTurn()) return;
        
        timeLeft = TURN_TIMER_DURATION;
        if (onTimerTick) onTimerTick(timeLeft);
        
        timerInterval = setInterval(function() {
            timeLeft--;
            if (onTimerTick) onTimerTick(timeLeft);
            
            if (timeLeft <= 0) {
                stopTimer();
                if (onTurnTimeout) onTurnTimeout();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function getMyPlayerId()    { return myPlayerId; }
    function getOpponentName()  { return opponentName; }
    function getMyName()        { return myName; }
    function getShotsPerPlayer(){ return shotsPerPlayer; }
    function getMode()          { return currentMode; }
    function getTimeLeft()      { return timeLeft; }

    // ── Internal ──────────────────────────────────────────────────────────────
    function _send(type, data) {
        if (!socket) return;
        var msg = { type: type };
        if (data !== undefined) msg.data = data;
        socket.emit(MSG_TAG, msg);
    }

    function _onServerMessage(msg) {
        if (!msg) return;
        switch (msg.type) {
                case MsgType.USER_CONNECTED:
            case MsgType.USER_DISCONNECTED:
                if (onOnlineCount) onOnlineCount(msg.data);
                break;

            case MsgType.REQUEST_ROOM_CONFIRMED:
                myPlayerId   = msg.data.playerId;
                opponentName = msg.data.opponent ? msg.data.opponent.name : 'Opponent';
                if (onRoomConfirmed) onRoomConfirmed(msg.data);
                break;

            case MsgType.REQUEST_ROOM_REJECTED:
                if (onRoomRejected) onRoomRejected(msg.data);
                break;

            case MsgType.GAME_EVENT:
                _onGameEvent(msg.data);
                break;

            case MsgType.PLAYER_LEFT:
                stopTimer();
                if (onOpponentLeft) onOpponentLeft();
                break;
        }
    }

    function _onGameEvent(data) {
        switch (data.event) {
            case Events.WAITING:
                if (onWaiting) onWaiting(data);
                break;

            case Events.GAME_START:
                myPlayerId      = data.myPlayerId;
                shotsPerPlayer  = data.shotsPerPlayer || 10;
                currentKickerId = data.firstKickerId;
                // resolve opponent name from players list
                if (data.players) {
                    for (var i = 0; i < data.players.length; i++) {
                        if (data.players[i].playerId != myPlayerId) {
                            opponentName = data.players[i].name;
                            break;
                        }
                    }
                }
                if (onGameStart) onGameStart(data);
                startTimer();
                break;

            case Events.ROUND_RESULT:
                stopTimer();
                currentKickerId = data.nextKickerId;
                if (onRoundResult) onRoundResult(data);
                if (!data.gameOver) {
                    setTimeout(function() { startTimer(); }, 2000);
                }
                break;

            case Events.GAME_END:
                stopTimer();
                if (onGameEnd) onGameEnd(data);
                break;
        }
    }

    // ── Expose ────────────────────────────────────────────────────────────────
    return {
        connect         : connect,
        connectForLobby : connectForLobby,
        requestBot      : requestBot,
        requestRandom   : requestRandom,
        createPrivateRoom: createPrivateRoom,
        joinPrivateRoom : joinPrivateRoom,
        sendKick        : sendKick,
        sendTurnTimeout : sendTurnTimeout,
        leaveRoom       : leaveRoom,
        isMyTurn        : isMyTurn,
        startTimer      : startTimer,
        stopTimer       : stopTimer,
        getMyPlayerId   : getMyPlayerId,
        getOpponentName : getOpponentName,
        getMyName       : getMyName,
        getShotsPerPlayer: getShotsPerPlayer,
        getMode         : getMode,
        getTimeLeft     : getTimeLeft,
        // callback setters
        set onWaiting       (fn) { onWaiting = fn; },
        set onRoomConfirmed (fn) { onRoomConfirmed = fn; },
        set onRoomRejected  (fn) { onRoomRejected = fn; },
        set onGameStart     (fn) { onGameStart = fn; },
        set onRoundResult   (fn) { onRoundResult = fn; },
        set onGameEnd       (fn) { onGameEnd = fn; },
        set onOpponentLeft  (fn) { onOpponentLeft = fn; },
        set onOnlineCount   (fn) { onOnlineCount = fn; },
        set onTimerTick     (fn) { onTimerTick = fn; },
        set onTurnTimeout   (fn) { onTurnTimeout = fn; },
        Events : Events,
        Mode   : Mode
    };
})();

// Global shorthand
var s_oMultiplayer = CMultiplayer;
