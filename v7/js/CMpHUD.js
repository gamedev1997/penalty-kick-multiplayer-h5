// ─────────────────────────────────────────────────────────────────────────────
// CMpHUD.js
// FINAL FIFA STYLE RESPONSIVE HUD
// Desktop + Mobile Optimized
// Pure JS + CSS
// ─────────────────────────────────────────────────────────────────────────────

function CMpHUD() {

    var _el = null;

    var _szMyName = 'You';
    var _szOppName = 'Opponent';
    var _szMyAvatar = '⚽';
    var _szOppAvatar = '🤖';

    var _iMaxShots = 10;

    var _aMyShots = [];
    var _aOppShots = [];

    // =====================================================
    // CSS
    // =====================================================
    function _injectStyles() {

        if (document.getElementById('mph-styles')) {
            return;
        }

        var s = document.createElement('style');

        s.id = 'mph-styles';

        s.textContent = `

/* =====================================================
ROOT HUD
===================================================== */
#mp-hud{

    position:fixed;

    left:0;
    right:0;

    bottom:0;

    width:100%;

    height:88px;

    z-index:9999;

    display:flex;

    align-items:flex-end;

    justify-content:space-between;

    font-family:
    Arial,
    Helvetica,
    sans-serif;

    pointer-events:none;

    overflow:visible;

    padding:0;

    box-sizing:border-box;
}

/* =====================================================
COMMON PANEL
===================================================== */
.mph-panel{

    position:relative;

    height:72px;

    overflow:visible;

    display:flex;

    flex-direction:column;

    justify-content:center;

    padding:6px 14px 10px 14px;

    box-sizing:border-box;

    border-top:2px solid rgba(255,255,255,0.08);

    backdrop-filter:blur(8px);
}

/* =====================================================
LEFT PANEL
===================================================== */
.mph-left{

    width:calc(50% - 220px);

    background:
    linear-gradient(
        135deg,
        rgba(70,0,0,0.88) 0%,
        rgba(18,0,0,0.92) 100%
    );

    border-top:2px solid #ef4444;

    border-top-right-radius:18px;

    box-shadow:
    inset 0 0 24px rgba(255,0,0,0.10),
    0 0 15px rgba(255,0,0,0.05);

    margin-left:0;

    margin-right:58px;
}

/* =====================================================
RIGHT PANEL
===================================================== */
.mph-right{

    width:calc(50% - 220px);

    background:
    linear-gradient(
        225deg,
        rgba(0,30,90,0.88) 0%,
        rgba(0,10,30,0.92) 100%
    );

    border-top:2px solid #3b82f6;

    border-top-left-radius:18px;

    box-shadow:
    inset 0 0 24px rgba(0,120,255,0.10),
    0 0 15px rgba(0,120,255,0.05);

    margin-left:auto;

    margin-right:0;
}

/* =====================================================
ACTIVE PANEL
===================================================== */
.mph-active{

    animation:mphPulse 1s ease-in-out infinite alternate;
}

@keyframes mphPulse{

    from{
        filter:brightness(1);
    }

    to{
        filter:brightness(1.15);
    }
}

/* =====================================================
PLAYER NAME
===================================================== */
.mph-name-row{

    display:flex;

    align-items:center;

    gap:6px;

    margin-bottom:2px;
}

.mph-right .mph-name-row{

    justify-content:flex-end;
}

.mph-name{

    font-size:11px;

    font-weight:900;

    letter-spacing:0.5px;

    text-transform:uppercase;

    white-space:nowrap;

    overflow:hidden;

    text-overflow:ellipsis;
}

.mph-left .mph-name{
    color:#ffb3b3;
}

.mph-right .mph-name{
    color:#9bc5ff;
}

/* =====================================================
YOU TAG
===================================================== */
.mph-you-tag{

    background:#facc15;

    color:#000;

    font-size:7px;

    font-weight:900;

    padding:1px 4px;

    border-radius:30px;

    letter-spacing:1px;
}

/* =====================================================
SCORE
===================================================== */
.mph-score{

    font-size:28px;

    font-weight:900;

    line-height:1;

    margin-top:1px;

    letter-spacing:-1px;

    text-shadow:
    0 0 12px rgba(255,255,255,0.18);
}

.mph-left .mph-score{

    color:#fff;
}

.mph-right .mph-score{

    color:#fff;

    text-align:right;
}

/* =====================================================
SHOT DOTS
===================================================== */
.mph-dots{

    display:flex;

    gap:4px;

    margin-top:6px;

    padding-bottom:2px;
}

.mph-right .mph-dots{

    justify-content:flex-end;
}

.mph-dot{

    width:8px;
    height:8px;

    border-radius:50%;
}

/* goal */
.mph-dot-goal{

    background:#22c55e;

    box-shadow:
    0 0 10px rgba(34,197,94,0.9);
}

/* miss */
.mph-dot-miss{

    background:#ef4444;

    opacity:0.45;
}

/* pending */
.mph-dot-pending{

    border:1px solid rgba(255,255,255,0.18);

    background:rgba(255,255,255,0.04);
}

/* =====================================================
CENTER PANEL
===================================================== */
.mph-center{

    position:absolute;

    left:50%;

    transform:translateX(-50%);

    bottom:0;

    width:96px;

    height:68px;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    background:
    linear-gradient(
        180deg,
        rgba(15,18,28,0.94) 0%,
        rgba(0,0,0,0.96) 100%
    );

    border-top:
    2px solid rgba(255,255,255,0.08);

    border-top-left-radius:16px;
    border-top-right-radius:16px;

    box-shadow:
    0 0 20px rgba(0,0,0,0.35);

    z-index:10;
}

/* =====================================================
TIMER
===================================================== */
.mph-timer{

    font-size:20px;

    font-weight:900;

    color:#fff;

    line-height:1;

    text-shadow:
    0 0 10px rgba(255,255,255,0.25);
}

.mph-timer-warn{

    color:#fb923c;
}

.mph-timer-critical{

    color:#ef4444;

    animation:mphCritical 0.45s ease-in-out infinite alternate;
}

@keyframes mphCritical{

    from{
        transform:scale(1);
    }

    to{
        transform:scale(1.08);
    }
}

/* =====================================================
TURN TEXT
===================================================== */
.mph-turn{

    margin-top:4px;

    padding:3px 8px;

    border-radius:50px;

    font-size:7px;

    font-weight:900;

    letter-spacing:1px;

    text-transform:uppercase;
}

/* my turn */
.mph-turn-mine{

    background:
    linear-gradient(
        90deg,
        #facc15,
        #fde047
    );

    color:#000;

    box-shadow:
    0 0 20px rgba(250,204,21,0.55);

    animation:mphTurnGlow 1s ease-in-out infinite alternate;
}

/* opp turn */
.mph-turn-opp{

    background:
    linear-gradient(
        90deg,
        #ef4444,
        #f87171
    );

    color:#fff;
}

/* wait */
.mph-turn-wait{

    background:rgba(255,255,255,0.08);

    color:rgba(255,255,255,0.45);
}

@keyframes mphTurnGlow{

    from{
        transform:scale(1);
    }

    to{
        transform:scale(1.05);
    }
}

/* =====================================================
FLASH
===================================================== */
.mph-flash{

    position:fixed;

    inset:0;

    pointer-events:none;

    z-index:9998;

    opacity:0;
}

.mph-flash-goal{

    background:
    radial-gradient(
        ellipse at center,
        rgba(34,197,94,0.28) 0%,
        transparent 70%
    );

    animation:mphFlash 0.7s ease-out forwards;
}

.mph-flash-miss{

    background:
    radial-gradient(
        ellipse at center,
        rgba(239,68,68,0.24) 0%,
        transparent 70%
    );

    animation:mphFlash 0.5s ease-out forwards;
}

@keyframes mphFlash{

    from{
        opacity:1;
    }

    to{
        opacity:0;
    }
}

/* =====================================================
TABLET
===================================================== */
@media(max-width:1024px){

    .mph-left{

        width:calc(50% - 170px);

        margin-right:50px;
    }

    .mph-right{

        width:calc(50% - 170px);

        margin-left:50px;
    }

    .mph-center{

        width:88px;
        height:60px;
    }
}

/* =====================================================
MOBILE
===================================================== */
@media(max-width:768px){

    #mp-hud{

        height:64px;
    }

    .mph-panel{

        height:54px;

        padding:4px 8px 8px 8px;
    }

    .mph-left{

        width:auto;

        flex:1;

        margin-right:42px;
    }

    .mph-right{

        width:auto;

        flex:1;

        margin-left:42px;
    }

    .mph-center{

        width:74px;

        height:54px;

        bottom:-1px;
    }

    .mph-score{

        font-size:18px;
    }

    .mph-name{

        font-size:8px;
    }

    .mph-dot{

        width:5px;
        height:5px;
    }

    .mph-dots{

        gap:2px;

        margin-top:3px;
    }

    .mph-timer{

        font-size:14px;
    }

    .mph-turn{

        font-size:5px;

        padding:2px 5px;

        margin-top:2px;
    }

    .mph-you-tag{

        font-size:5px;

        padding:1px 3px;
    }
}

.mph-avatar {
    font-size: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 26px;
    height: 26px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

@media(max-width:768px){
    .mph-avatar {
        width: 18px;
        height: 18px;
        font-size: 11px;
    }
}
`;

        document.head.appendChild(s);
    }

    // =====================================================
    // BUILD DOM
    // =====================================================
    function _buildDOM() {

        _el = document.createElement('div');

        _el.id = 'mp-hud';

        _el.innerHTML =

            '<div class="mph-panel mph-left" id="mph-left">' +

            '  <div class="mph-name-row">' +
            '    <span class="mph-avatar">' + _szMyAvatar + '</span>' +
            '    <span class="mph-name" id="mph-my-name"></span>' +
            '    <span class="mph-you-tag">YOU</span>' +
            '  </div>' +

            '  <div class="mph-score" id="mph-my-score">0</div>' +

            '  <div class="mph-dots" id="mph-my-dots"></div>' +

            '</div>' +

            '<div class="mph-center">' +

            '  <div class="mph-timer" id="mph-timer">—</div>' +

            '  <div class="mph-turn mph-turn-wait" id="mph-turn">WAITING</div>' +

            '</div>' +

            '<div class="mph-panel mph-right" id="mph-right">' +

            '  <div class="mph-name-row">' +
            '    <span class="mph-avatar">' + _szOppAvatar + '</span>' +
            '    <span class="mph-name" id="mph-opp-name"></span>' +
            '  </div>' +

            '  <div class="mph-score" id="mph-opp-score">0</div>' +

            '  <div class="mph-dots" id="mph-opp-dots"></div>' +

            '</div>';

        document.body.appendChild(_el);

        document.getElementById('mph-my-name').textContent = _szMyName;
        document.getElementById('mph-opp-name').textContent = _szOppName;

        _renderDots('mph-my-dots', _aMyShots, _iMaxShots);
        _renderDots('mph-opp-dots', _aOppShots, _iMaxShots);
    }

    // =====================================================
    // DOTS
    // =====================================================
    function _renderDots(id, shots, max) {

        var el = document.getElementById(id);

        if (!el) return;

        var html = '';

        for (var i = 0; i < max; i++) {

            var cls = 'mph-dot ';

            if (i < shots.length) {

                cls += shots[i] === 'goal'
                    ? 'mph-dot-goal'
                    : 'mph-dot-miss';

            } else {

                cls += 'mph-dot-pending';
            }

            html += '<span class="' + cls + '"></span>';
        }

        el.innerHTML = html;
    }

    // =====================================================
    // FLASH
    // =====================================================
    function _flash(goal) {

        var f = document.createElement('div');

        f.className =
            'mph-flash ' +
            (goal ? 'mph-flash-goal' : 'mph-flash-miss');

        document.body.appendChild(f);

        setTimeout(function () {

            if (f.parentNode) {
                f.parentNode.removeChild(f);
            }

        }, 700);
    }

    // =====================================================
    // API
    // =====================================================
    this.init = function (myName, oppName, maxShots, myAvatar, oppAvatar) {

        _injectStyles();

        _szMyName = myName || 'You';
        _szOppName = oppName || 'Opponent';
        _szMyAvatar = myAvatar || '⚽';
        _szOppAvatar = oppAvatar || '🤖';

        _iMaxShots = maxShots || 10;

        _buildDOM();
    };

    this.setTurn = function (myTurn) {

        var left = document.getElementById('mph-left');
        var right = document.getElementById('mph-right');
        var turn = document.getElementById('mph-turn');

        if (myTurn) {

            left.classList.add('mph-active');
            right.classList.remove('mph-active');

            turn.textContent = 'YOUR TURN';
            turn.className = 'mph-turn mph-turn-mine';

        } else {

            right.classList.add('mph-active');
            left.classList.remove('mph-active');

            turn.textContent = 'OPP TURN';
            turn.className = 'mph-turn mph-turn-opp';
        }
    };

    this.setTimer = function (sec) {

        var el = document.getElementById('mph-timer');

        if (!el) return;

        el.textContent = sec + 's';

        el.className = 'mph-timer';

        if (sec <= 5) {
            el.classList.add('mph-timer-critical');
        } else if (sec <= 9) {
            el.classList.add('mph-timer-warn');
        }
    };

    this.setScore = function (myGoals, oppGoals) {

        document.getElementById('mph-my-score').textContent = myGoals;
        document.getElementById('mph-opp-score').textContent = oppGoals;
    };

    this.recordShot = function (wasMe, goal) {

        if (wasMe) {

            _aMyShots.push(goal ? 'goal' : 'miss');

            _renderDots(
                'mph-my-dots',
                _aMyShots,
                _iMaxShots
            );

        } else {

            _aOppShots.push(goal ? 'goal' : 'miss');

            _renderDots(
                'mph-opp-dots',
                _aOppShots,
                _iMaxShots
            );
        }

        _flash(goal);
    };

    this.showResult = function (txt) {

        var turn = document.getElementById('mph-turn');

        if (turn) {

            turn.textContent = txt;

            turn.className = 'mph-turn mph-turn-wait';
        }
    };

    this.unload = function () {

        if (_el && _el.parentNode) {

            _el.parentNode.removeChild(_el);
        }

        _el = null;
    };

    return this;
}

window.CMpHUD = CMpHUD;

var s_oMpHUD = null;