// ─── CModeSelect.js ───────────────────────────────────────────────────────────
// Overlay UI for mode selection + private room code entry.
// Shown after preloader, before CGame starts.

function CModeSelect(onModeReady) {
    var _onReady = onModeReady;
    var _el      = null;

    // ── Build overlay ─────────────────────────────────────────────────────────
    this._init = function () {
        _el = document.createElement('div');
        _el.id = 'mode-select-overlay';
        _el.innerHTML = [
            '<div class="ms-bg-blur"></div>',
            '<div class="ms-card">',

            // ── Header ──
            '  <div class="ms-header">',
            '    <div class="ms-ball-icon">⚽</div>',
            '    <div class="ms-title">PENALTY KICK</div>',
            '    <div class="ms-subtitle">Multiplayer Challenge</div>',
            '    <div class="ms-online-badge" id="ms-online-badge">',
            '      <span class="ms-online-dot"></span>',
            '      <span id="ms-online-text">Connecting...</span>',
            '    </div>',
            '  </div>',

            // ── Name input ──
            '  <div class="ms-name-wrap">',
            '    <input id="ms-name" class="ms-input" type="text" placeholder="Enter your name" maxlength="20">',
            '  </div>',

            // ── Mode buttons screen ──
            '  <div id="ms-screen-mode">',
            '    <p class="ms-section-label">SELECT MODE</p>',
            '    <div class="ms-btn-group">',
            '      <button class="ms-btn ms-btn-bot" onclick="s_oModeSelect._onBot()">Vs Bot</button>',
            '      <button class="ms-btn ms-btn-random" onclick="s_oModeSelect._onRandom()">Play Online</button>',
            '      <button class="ms-btn ms-btn-friend" onclick="s_oModeSelect._showFriend()">Play with Friend</button>',
            '    </div>',
            '  </div>',

            // ── Friend sub-screen ──
            '  <div id="ms-screen-friend" style="display:none">',
            '    <p class="ms-section-label">PLAY WITH FRIEND</p>',
            '    <div class="ms-btn-group">',
            '      <button class="ms-btn ms-btn-create" onclick="s_oModeSelect._onCreateRoom()">',
            '        <span class="ms-btn-icon">🏠</span>',
            '        <span class="ms-btn-text"><strong>Create Room</strong><small>Share code with friend</small></span>',
            '      </button>',
            '    </div>',
            '    <div class="ms-divider"><span>— or join existing —</span></div>',
            '    <div class="ms-join-row">',
            '      <input id="ms-code" class="ms-input ms-code-input" type="text" placeholder="ROOM CODE" maxlength="8" oninput="s_oModeSelect._clearCodeError()">',
            '      <button class="ms-join-btn" onclick="s_oModeSelect._onJoinRoom()">JOIN</button>',
            '    </div>',
            '    <div id="ms-code-error" class="ms-error" style="display:none">❌ Invalid room code. Please check and try again.</div>',
            '    <button class="ms-back-btn" onclick="s_oModeSelect._showMode()">← Back to Modes</button>',
            '  </div>',

            // ── Waiting screen ──
            '  <div id="ms-screen-waiting" style="display:none">',
            '    <div class="ms-waiting-wrap">',
            '      <div class="ms-spinner"><div></div><div></div><div></div><div></div></div>',
            '      <p class="ms-waiting-title">Finding Opponent</p>',
            '      <div id="ms-room-code-box" class="ms-room-code" style="display:none">',
            '        <span class="ms-room-label">ROOM CODE</span>',
            '        <span id="ms-room-code-val"></span>',
            '      </div>',
            '      <p class="ms-waiting-hint" id="ms-waiting-hint">Connecting to server...</p>',
            '      <button class="ms-back-btn" onclick="s_oModeSelect._onCancel()">✕ Cancel</button>',
            '    </div>',
            '  </div>',

            '</div>'
        ].join('');

        document.body.appendChild(_el);
        document.getElementById('ms-name').value = this._randomName();
        this._injectStyles();
        this._startBallAnim();

        // ── Connect lobby socket for online count ──────────────────────────────
        if (s_oMultiplayer && s_oMultiplayer.connectForLobby) {
            s_oMultiplayer.onOnlineCount = function (iCount) {
                var txt = document.getElementById('ms-online-text');
                if (txt) txt.textContent = iCount + ' online';
                var badge = document.getElementById('ms-online-badge');
                if (badge) badge.classList.add('ms-online-connected');
            };
            s_oMultiplayer.connectForLobby();
            // If server never sends a count event, at least show "Online" on connect
            setTimeout(function () {
                var txt = document.getElementById('ms-online-text');
                if (txt && txt.textContent === 'Connecting...') {
                    txt.textContent = 'Online';
                    var badge = document.getElementById('ms-online-badge');
                    if (badge) badge.classList.add('ms-online-connected');
                }
            }, 2500);
        }
    };

    // ── Ball header pulse animation ───────────────────────────────────────────
    this._startBallAnim = function () {
        var ball = _el.querySelector('.ms-ball-icon');
        if (!ball) return;
        var angle = 0;
        setInterval(function () {
            angle = (angle + 1) % 360;
            ball.style.transform = 'rotate(' + angle + 'deg)';
        }, 30);
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
            codeBox.style.display = 'flex';
            document.getElementById('ms-room-code-val').textContent = roomCode;
        } else {
            codeBox.style.display = 'none';
        }
        var hint = document.getElementById('ms-waiting-hint');
        if (hint) hint.textContent = roomCode ? 'Share the code with your friend' : 'Looking for a match...';
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    this._randomName = function () {
        var adj  = ['Swift','Bold','Iron','Fire','Gold','Dark','Sky','Storm','Blaze','Icy',
                    'Wild','Steel','Brave','Flash','Turbo','Neon','Shadow','Royal','Sonic','Frost'];
        var noun = ['Eagle','Tiger','Wolf','Hawk','Lion','Cobra','Shark','Falcon','Viper','Bear',
                    'Puma','Rhino','Panther','Fox','Drake','Bolt','Knight','Ace','Rex','Blaze'];
        var a = adj[Math.floor(Math.random()  * adj.length)];
        var n = noun[Math.floor(Math.random() * noun.length)];
        var d = Math.floor(Math.random() * 90) + 10;
        return a + n + d;
    };

    this._getName = function () {
        var n = document.getElementById('ms-name').value.trim();
        return n || this._randomName();
    };

    this._clearCodeError = function () {
        document.getElementById('ms-code-error').style.display = 'none';
        document.getElementById('ms-code').style.borderColor   = 'rgba(255,255,255,0.15)';
    };

    // ── Mode handlers ─────────────────────────────────────────────────────────
    this._onBot = function () {
        this._showWaiting(null);
        s_oMultiplayer.onRoomConfirmed = function () {};
        s_oMultiplayer.onGameStart     = function (data) { s_oModeSelect._startGame(data); };
        s_oMultiplayer.requestBot();
    };

    this._onRandom = function () {
        s_oMultiplayer.connect(this._getName());
        this._showWaiting(null);
        s_oMultiplayer.onWaiting       = function () {};
        s_oMultiplayer.onRoomConfirmed = function () {};
        s_oMultiplayer.onGameStart     = function (data) { s_oModeSelect._startGame(data); };
        this._setupCommonCallbacks();
        s_oMultiplayer.requestRandom();
    };

    this._onCreateRoom = function () {
        var code = Math.random().toString(36).substring(2, 7).toUpperCase();
        s_oMultiplayer.connect(this._getName());
        this._showWaiting(code);
        s_oMultiplayer.onWaiting   = function () {};
        s_oMultiplayer.onGameStart = function (data) { s_oModeSelect._startGame(data); };
        this._setupCommonCallbacks();
        s_oMultiplayer.createPrivateRoom(code);
    };

    this._onJoinRoom = function () {
        var code = document.getElementById('ms-code').value.trim().toUpperCase();
        if (!code) {
            var err = document.getElementById('ms-code-error');
            err.style.display = 'block';
            err.textContent   = '⚠️ Please enter a room code first.';
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
        if (_el && _el.parentNode) { document.body.removeChild(_el); }
        _el = null;
        if (_onReady) _onReady(data);
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    this._injectStyles = function () {
        if (document.getElementById('ms-styles')) return;
        var style = document.createElement('style');
        style.id = 'ms-styles';
        style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');

#mode-select-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; font-family: 'Outfit', Arial, sans-serif;
    overflow: hidden;
    padding: 8px;
    box-sizing: border-box;
}

/* Blurred game-bg feel */
.ms-bg-blur {
    position: absolute; inset: 0;
    background:
        radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.12) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.10) 0%, transparent 60%),
        linear-gradient(160deg, #020c18 0%, #051a2e 50%, #0a1628 100%);
}
.ms-bg-blur::before {
    content: '';
    position: absolute; inset: 0;
    background-image: repeating-linear-gradient(
        90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px
    ), repeating-linear-gradient(
        0deg,  rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px
    );
}

/* Main card — strictly viewport-contained, scrolls internally */
.ms-card {
    position: relative; z-index: 1;
    background: rgba(5, 20, 40, 0.88);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 24px;
    padding: 28px 28px 24px;
    width: min(400px, 100%);
    /* Hard cap: never taller than the visible screen */
    max-height: calc(100vh - 16px);
    /* Flex column — children scroll, NOT the card itself overflowing */
    display: flex; flex-direction: column;
    gap: 16px;
    /* overflow on the card itself so content is clipped */
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.06);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    /* No translateY — keeps card inside viewport during animation */
    animation: msCardIn 0.4s ease-out both;
    box-sizing: border-box;
}
/* Inner scroll area wraps every screen panel */
#ms-screen-mode,
#ms-screen-friend,
#ms-screen-waiting {
    overflow-y: auto;
    overflow-x: hidden;
    /* min-height:0 lets flex children actually shrink & scroll */
    min-height: 0;
    flex: 1;
}
@keyframes msCardIn {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
}

/* Header */
.ms-header { text-align: center; padding-bottom: 4px; }
.ms-ball-icon {
    font-size: 42px; display: inline-block;
    filter: drop-shadow(0 0 16px rgba(255,215,0,0.6));
    margin-bottom: 6px;
}
.ms-title {
    font-size: 26px; font-weight: 800; letter-spacing: 4px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: none;
}
.ms-subtitle {
    font-size: 12px; font-weight: 600; letter-spacing: 2px;
    color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 2px;
}

/* Online badge */
.ms-online-badge {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 8px;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
    font-size: 12px; font-weight: 600; letter-spacing: 1px;
    color: rgba(255,255,255,0.35);
    transition: all 0.4s ease;
}
.ms-online-badge.ms-online-connected {
    background: rgba(34,197,94,0.10);
    border-color: rgba(34,197,94,0.30);
    color: rgba(34,197,94,0.85);
}
.ms-online-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,0.25);
    display: inline-block;
    transition: background 0.4s;
}
.ms-online-connected .ms-online-dot {
    background: #22c55e;
    box-shadow: 0 0 0 0 rgba(34,197,94,0.6);
    animation: msDotPulse 1.8s infinite;
}
@keyframes msDotPulse {
    0%   { box-shadow: 0 0 0 0   rgba(34,197,94,0.6); }
    70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
    100% { box-shadow: 0 0 0 0   rgba(34,197,94,0); }
}

/* Divider */
.ms-divider {
    display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.25);
    font-size: 12px; letter-spacing: 1px;
}
.ms-divider::before, .ms-divider::after {
    content:''; flex:1; height:1px; background:rgba(255,255,255,0.1);
}

/* Name wrap */
.ms-name-wrap {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 12px; padding: 4px 14px;
    transition: border-color 0.2s;
}
.ms-name-wrap:focus-within { border-color: rgba(255,215,0,0.5); }
.ms-input-icon { font-size: 16px; opacity: 0.6; }
.ms-input {
    flex:1; background:transparent; border:none; outline:none;
    color: #fff; font-size: 15px; font-family: inherit; font-weight: 600;
    padding: 10px 0; text-align: center;
}
.ms-input::placeholder { color: rgba(255,255,255,0.3); font-weight: 400; text-align: center; }

/* Section label */
.ms-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 3px;
    color: rgba(255,255,255,0.35); text-align: center; margin: 0 0 10px;
}

/* Button group */
.ms-btn-group { display: flex; flex-direction: column; gap: 10px; }

/* Mode buttons */
.ms-btn {
    width: 100%; padding: 14px 16px;
    border-radius: 14px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    text-align: center;
    font-family: inherit; font-size: 16px; font-weight: 700;
    color: #fff;
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    position: relative; overflow: hidden;
}
.ms-btn::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events:none;
}
.ms-btn:hover  { transform: translateY(-2px); filter: brightness(1.1); }
.ms-btn:active { transform: translateY(0);    filter: brightness(0.95); }

.ms-btn-bot    { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 20px rgba(22,163,74,0.35); }
.ms-btn-random { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); box-shadow: 0 4px 20px rgba(29,78,216,0.35); }
.ms-btn-friend { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); box-shadow: 0 4px 20px rgba(124,58,237,0.35); }
.ms-btn-create { background: linear-gradient(135deg, #b45309 0%, #92400e 100%); box-shadow: 0 4px 20px rgba(180,83,9,0.35); }


/* Join row */
.ms-join-row { display:flex; gap:8px; align-items: center; }
.ms-code-input {
    flex:1; text-transform:uppercase; letter-spacing:5px;
    text-align:center; font-weight:800; font-size:17px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 12px; padding: 12px 10px;
    color: #FFD700; outline: none;
    transition: border-color 0.2s;
}
.ms-code-input:focus { border-color: rgba(255,215,0,0.5); }
.ms-code-input::placeholder { color:rgba(255,255,255,0.25); letter-spacing:2px; font-size:13px; font-weight:600; }
.ms-join-btn {
    padding: 12px 18px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #000; font-weight: 800; font-size: 14px;
    cursor: pointer; font-family: inherit; letter-spacing: 1px;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 16px rgba(255,165,0,0.4);
}
.ms-join-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,165,0,0.5); }

/* Error */
.ms-error {
    color: #f87171; font-size: 12px; font-weight: 600;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    padding: 8px 12px; border-radius: 10px; text-align: center;
}

/* Back button */
.ms-back-btn {
    width:100%; padding: 10px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent; color: rgba(255,255,255,0.5);
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; transition: all 0.2s;
}
.ms-back-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }

/* Room code display */
.ms-room-code {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: rgba(255,215,0,0.08);
    border: 1.5px solid rgba(255,215,0,0.25);
    border-radius: 14px; padding: 12px 24px; text-align: center;
}
.ms-room-label { font-size: 10px; letter-spacing: 3px; color: rgba(255,215,0,0.6); font-weight: 700; }
#ms-room-code-val {
    font-size: 28px; font-weight: 800; letter-spacing: 8px;
    color: #FFD700; text-shadow: 0 0 20px rgba(255,215,0,0.4);
}

/* Waiting */
.ms-waiting-wrap { display:flex; flex-direction:column; align-items:center; gap:16px; padding:8px 0; }
.ms-waiting-title { font-size:18px; font-weight:700; color:#fff; margin:0; }
.ms-waiting-hint  { font-size:13px; color:rgba(255,255,255,0.4); margin:0; text-align:center; }

/* Spinner */
.ms-spinner {
    width: 48px; height: 48px; position: relative;
}
.ms-spinner div {
    position:absolute; width:8px; height:8px; border-radius:50%;
    background: #FFD700; animation: msSpinner 1.2s linear infinite;
}
.ms-spinner div:nth-child(1) { top:0;    left:20px; animation-delay:-0.9s; }
.ms-spinner div:nth-child(2) { top:20px; left:40px; animation-delay:-0.6s; }
.ms-spinner div:nth-child(3) { top:40px; left:20px; animation-delay:-0.3s; }
.ms-spinner div:nth-child(4) { top:20px; left:0;    animation-delay:0s;    }
@keyframes msSpinner {
    0%,100%{ opacity:0.15; transform:scale(0.8); }
    50%    { opacity:1;    transform:scale(1.2); }
}

/* Scrollbar */
.ms-card::-webkit-scrollbar { width:4px; }
.ms-card::-webkit-scrollbar-track { background:transparent; }
.ms-card::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:2px; }

/* Mobile portrait tweaks */
@media (max-width: 420px) {
    .ms-card      { padding: 18px 14px; gap: 10px; }
    .ms-title     { font-size: 20px; letter-spacing: 3px; }
    .ms-btn       { padding: 10px 12px; gap: 10px; }
    .ms-ball-icon { font-size: 30px; }
}

/* Landscape mobile — very limited height, make everything compact */
@media (max-height: 500px) {
    .ms-card        { padding: 12px 16px; gap: 8px; max-height: 96vh; border-radius: 16px; }
    .ms-ball-icon   { font-size: 24px; margin-bottom: 0; }
    .ms-title       { font-size: 18px; letter-spacing: 2px; }
    .ms-subtitle    { display: none; }
    .ms-header      { padding-bottom: 0; }
    .ms-name-wrap   { padding: 2px 12px; }
    .ms-input       { padding: 7px 0; font-size: 13px; }
    .ms-section-label { margin: 0 0 6px; }
    .ms-btn-group   { gap: 7px; }
    .ms-btn         { padding: 9px 12px; gap: 10px; }
    .ms-btn-text strong { font-size: 13px; }
    .ms-btn-text small  { display: none; }
    .ms-btn-icon    { font-size: 20px; }
    .ms-join-row    { gap: 6px; }
    .ms-code-input  { padding: 9px 8px; font-size: 14px; }
    .ms-join-btn    { padding: 9px 14px; font-size: 13px; }
    .ms-back-btn    { padding: 7px; font-size: 12px; }
    .ms-waiting-wrap { gap: 10px; padding: 4px 0; }
    .ms-spinner     { width: 36px; height: 36px; }
    .ms-spinner div { width: 6px; height: 6px; }
    .ms-spinner div:nth-child(1) { top:0;    left:15px; }
    .ms-spinner div:nth-child(2) { top:15px; left:30px; }
    .ms-spinner div:nth-child(3) { top:30px; left:15px; }
    .ms-spinner div:nth-child(4) { top:15px; left:0;    }
    .ms-waiting-title { font-size: 15px; }
    .ms-room-code   { padding: 8px 16px; }
    #ms-room-code-val { font-size: 22px; letter-spacing: 5px; }
    .ms-divider     { font-size: 11px; }
}
        `;
        document.head.appendChild(style);
    };

    s_oModeSelect = this;
    this._init();
}

var s_oModeSelect = null;
