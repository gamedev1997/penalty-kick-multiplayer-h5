// ─── CModeSelect.js ───────────────────────────────────────────────────────────
// Overlay UI for mode selection + private room code entry.
// Shown after Play is pressed in CMenu, before CGame starts.

function CModeSelect(onModeReady) {
    var _onReady = onModeReady; // called when match is confirmed and game should start
    var _el      = null;        // root overlay div

    // ── Build overlay ─────────────────────────────────────────────────────────
    this._init = function () {
        _el = document.createElement('div');
        _el.id = 'mode-select-overlay';
        _el.innerHTML = [
            '<div class="ms-box">',
            '  <div class="ms-logo">⚽ Penalty Kick</div>',

            // ── Name input ──
            '  <input id="ms-name" class="ms-input" type="text" placeholder="Enter your name" maxlength="20">',

            // ── Mode buttons ──
            '  <div id="ms-screen-mode">',
            '    <p class="ms-label">Select Mode</p>',
            '    <button class="ms-btn ms-btn-bot"    onclick="s_oModeSelect._onBot()">🤖 vs Bot</button>',
            '    <button class="ms-btn ms-btn-random" onclick="s_oModeSelect._onRandom()">🌐 Random Online</button>',
            '    <button class="ms-btn ms-btn-friend" onclick="s_oModeSelect._showFriend()">👥 Play with Friend</button>',
            '  </div>',

            // ── Friend sub-screen ──
            '  <div id="ms-screen-friend" style="display:none">',
            '    <p class="ms-label">Play with Friend</p>',
            '    <button class="ms-btn ms-btn-friend" onclick="s_oModeSelect._onCreateRoom()">🏠 Create Room</button>',
            '    <div class="ms-or">— or —</div>',
            '    <input id="ms-code" class="ms-input ms-code-input" type="text" placeholder="Enter room code" maxlength="8" oninput="s_oModeSelect._clearCodeError()">',
            '    <div id="ms-code-error" class="ms-error" style="display:none">❌ Invalid room code. Please check and try again.</div>',
            '    <button class="ms-btn ms-btn-random" onclick="s_oModeSelect._onJoinRoom()">🔗 Join Room</button>',
            '    <button class="ms-btn ms-btn-back"   onclick="s_oModeSelect._showMode()">← Back</button>',
            '  </div>',

            // ── Waiting screen ──
            '  <div id="ms-screen-waiting" style="display:none">',
            '    <p class="ms-label">Waiting for Opponent</p>',
            '    <div id="ms-room-code-box" class="ms-room-code" style="display:none"></div>',
            '    <p class="ms-waiting-dots">Searching</p>',
            '    <button class="ms-btn ms-btn-back" onclick="s_oModeSelect._onCancel()">✕ Cancel</button>',
            '  </div>',

            '</div>'
        ].join('');

        document.body.appendChild(_el);
        // Pre-fill name field with a random identity (player can edit if desired)
        document.getElementById('ms-name').value = this._randomName();
        this._injectStyles();
    };

    // ── Screen switches ───────────────────────────────────────────────────────
    this._showMode = function () {
        document.getElementById('ms-screen-mode').style.display    = 'block';
        document.getElementById('ms-screen-friend').style.display  = 'none';
        document.getElementById('ms-screen-waiting').style.display = 'none';
    };

    this._showFriend = function () {
        document.getElementById('ms-screen-mode').style.display    = 'none';
        document.getElementById('ms-screen-friend').style.display  = 'block';
        document.getElementById('ms-screen-waiting').style.display = 'none';
    };

    this._showWaiting = function (roomCode) {
        document.getElementById('ms-screen-mode').style.display    = 'none';
        document.getElementById('ms-screen-friend').style.display  = 'none';
        document.getElementById('ms-screen-waiting').style.display = 'block';
        var codeBox = document.getElementById('ms-room-code-box');
        if (roomCode) {
            codeBox.style.display = 'block';
            codeBox.textContent   = roomCode;
        } else {
            codeBox.style.display = 'none';
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    this._randomName = function () {
        var adj  = ['Swift','Bold','Iron','Fire','Gold','Dark','Sky','Storm','Blaze','Icy',
                    'Wild','Steel','Brave','Flash','Turbo','Neon','Shadow','Royal','Sonic','Frost'];
        var noun = ['Eagle','Tiger','Wolf','Hawk','Lion','Cobra','Shark','Falcon','Viper','Bear',
                    'Puma','Rhino','Panther','Fox','Drake','Bolt','Knight','Ace','Rex','Blaze'];
        var a = adj[Math.floor(Math.random()  * adj.length)];
        var n = noun[Math.floor(Math.random() * noun.length)];
        var d = Math.floor(Math.random() * 90) + 10; // 10-99
        return a + n + d;
    };

    this._getName = function () {
        var n = document.getElementById('ms-name').value.trim();
        return n || this._randomName();
    };

    this._clearCodeError = function () {
        document.getElementById('ms-code-error').style.display = 'none';
        document.getElementById('ms-code').style.borderColor   = '#444';
    };

    // ── Mode handlers ─────────────────────────────────────────────────────────
    this._onBot = function () {
        s_oMultiplayer.connect(this._getName());
        this._showWaiting(null);
        s_oMultiplayer.onRoomConfirmed = function (data) { /* bot: game starts immediately */ };
        s_oMultiplayer.onGameStart     = function (data) { s_oModeSelect._startGame(data); };
        s_oMultiplayer.requestBot();
    };

    this._onRandom = function () {
        s_oMultiplayer.connect(this._getName());
        this._showWaiting(null);
        s_oMultiplayer.onWaiting       = function () { /* already on waiting screen */ };
        s_oMultiplayer.onRoomConfirmed = function (data) { /* confirmed, waiting for game start */ };
        s_oMultiplayer.onGameStart     = function (data) { s_oModeSelect._startGame(data); };
        this._setupCommonCallbacks();
        s_oMultiplayer.requestRandom();
    };

    this._onCreateRoom = function () {
        var code = Math.random().toString(36).substring(2, 7).toUpperCase();
        s_oMultiplayer.connect(this._getName());
        this._showWaiting(code);
        s_oMultiplayer.onWaiting       = function (data) { /* already showing code */ };
        s_oMultiplayer.onGameStart     = function (data) { s_oModeSelect._startGame(data); };
        this._setupCommonCallbacks();
        s_oMultiplayer.createPrivateRoom(code);
    };

    this._onJoinRoom = function () {
        var code = document.getElementById('ms-code').value.trim().toUpperCase();
        if (!code) {
            var err = document.getElementById('ms-code-error');
            err.style.display   = 'block';
            err.textContent     = '⚠️ Please enter a room code first.';
            return;
        }
        s_oMultiplayer.connect(this._getName());
        this._showWaiting(null);
        s_oMultiplayer.onGameStart = function (data) { s_oModeSelect._startGame(data); };
        this._setupCommonCallbacks();
        s_oMultiplayer.joinPrivateRoom(code);
    };

    this._onCancel = function () {
        s_oMultiplayer.leaveRoom();
        this._showMode();
    };

    this._setupCommonCallbacks = function () {
        s_oMultiplayer.onRoomRejected = function (code) {
            if (code === 5) {
                // ROOM_NOT_FOUND — invalid join code
                s_oModeSelect._showFriend();
                var err = document.getElementById('ms-code-error');
                err.style.display = 'block';
                document.getElementById('ms-code').style.borderColor = '#e74c3c';
                document.getElementById('ms-code').focus();
            } else {
                s_oModeSelect._showMode();
                alert('Could not join. Please try again.');
            }
        };
    };

    // ── Start game ────────────────────────────────────────────────────────────
    this._startGame = function (data) {
        // Remove overlay and hand control to CGame
        document.body.removeChild(_el);
        _el = null;
        if (_onReady) _onReady(data);
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    this._injectStyles = function () {
        if (document.getElementById('ms-styles')) return;
        var style = document.createElement('style');
        style.id = 'ms-styles';
        style.textContent = [
            '#mode-select-overlay{position:fixed;top:0;left:0;width:100%;height:100%;',
            'background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;z-index:9999;}',
            '.ms-box{background:#16213e;border-radius:16px;padding:28px 24px;width:340px;',
            'display:flex;flex-direction:column;gap:12px;font-family:Arial,sans-serif;color:#eee;}',
            '.ms-logo{font-size:24px;font-weight:bold;color:#f0a500;text-align:center;}',
            '.ms-label{font-size:14px;color:#aaa;text-align:center;margin:0;}',
            '.ms-input{width:100%;padding:10px 12px;border-radius:8px;border:2px solid #444;',
            'background:#0f3460;color:#eee;font-size:15px;box-sizing:border-box;}',
            '.ms-input:focus{outline:none;border-color:#f0a500;}',
            '.ms-code-input{text-transform:uppercase;letter-spacing:4px;text-align:center;}',
            '.ms-btn{width:100%;padding:11px;border-radius:10px;border:none;font-size:15px;',
            'font-weight:bold;cursor:pointer;transition:opacity .2s;}',
            '.ms-btn:hover{opacity:.85;}',
            '.ms-btn-bot{background:#27ae60;color:#fff;}',
            '.ms-btn-random{background:#2980b9;color:#fff;}',
            '.ms-btn-friend{background:#8e44ad;color:#fff;}',
            '.ms-btn-back{background:#555;color:#eee;font-size:13px;padding:8px;}',
            '.ms-or{text-align:center;color:#666;font-size:13px;}',
            '.ms-error{color:#e74c3c;font-size:13px;background:#2a0a0a;padding:8px 10px;',
            'border-radius:8px;text-align:center;}',
            '.ms-room-code{font-size:26px;font-weight:bold;letter-spacing:6px;color:#f0a500;',
            'background:#0f3460;padding:10px 20px;border-radius:8px;text-align:center;}',
            '.ms-waiting-dots{color:#aaa;font-size:14px;text-align:center;margin:0;}',
            '.ms-waiting-dots::after{content:"";animation:msdots 1.5s infinite;}',
            '@keyframes msdots{0%{content:"."}33%{content:".."}66%{content:"..."}}'
        ].join('');
        document.head.appendChild(style);
    };

    s_oModeSelect = this;
    this._init();
}

var s_oModeSelect = null;
