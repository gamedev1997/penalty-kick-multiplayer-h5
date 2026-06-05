// ─────────────────────────────────────────────────────────────────────────────
// CMpHUD.js
// EA SPORTS FC / FIFA MOBILE MULTIPLAYER PENALTY SHOOTOUT HUD
// Three Separate Floating Panels (Left Player, Center Timer, Right Opponent)
// Positioned at Bottom-Left, Bottom-Center, and Bottom-Right of the Viewport
// Desktop + Mobile Landscape Optimized (Pure JS + CSS)
// ─────────────────────────────────────────────────────────────────────────────

function CMpHUD() {

    var _el = null;

    var _szMyName = 'You';
    var _szOppName = 'Opponent';
    var _szMyAvatar = 'sprites/Avatars/default.png';
    var _szOppAvatar = 'sprites/Avatars/default.png';

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
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;700;900&family=Teko:wght@500;700;900&display=swap');

#mp-hud {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: clamp(100px, 20vmin, 200px);
    z-index: 9999;
    pointer-events: none;
    overflow: visible;
    box-sizing: border-box;
}

/* Decorative glowing lines on the grass */
.mph-glow-line {
    position: absolute;
    bottom: clamp(6px, 1vmin, 12px);
    width: 38%;
    height: clamp(4px, 0.8vmin, 8px);
    filter: blur(5px);
    z-index: 0;
    pointer-events: none;
    opacity: 0.6;
}
.left-glow-line {
    left: clamp(15px, 4vmin, 40px);
    background: linear-gradient(90deg, rgba(255,59,48,0.8) 0%, rgba(255,59,48,0.3) 50%, rgba(255,59,48,0) 100%);
}
.right-glow-line {
    right: clamp(15px, 4vmin, 40px);
    background: linear-gradient(270deg, rgba(0,168,255,0.8) 0%, rgba(0,168,255,0.3) 50%, rgba(0,168,255,0) 100%);
}

/* Floating Cards Wrapper */
.mph-card-wrapper {
    position: absolute;
    bottom: clamp(10px, 2vmin, 20px);
    width: clamp(250px, 46vmin, 440px);
    height: clamp(74px, 13.5vmin, 120px);
    z-index: 10;
    pointer-events: auto;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.left-card-wrapper {
    left: clamp(15px, 4vmin, 40px);
    filter: drop-shadow(0 0 12px rgba(255, 59, 48, 0.4));
    color: #FF3B30;
}
.left-card-wrapper.active-turn {
    animation: activeLeftGlow 2s infinite ease-in-out;
}
.right-card-wrapper {
    right: clamp(15px, 4vmin, 40px);
    filter: drop-shadow(0 0 12px rgba(0, 168, 255, 0.4));
    color: #00C6FF;
}
.right-card-wrapper.active-turn {
    animation: activeRightGlow 2s infinite ease-in-out;
}

/* Bobbing arrow indicator above active card */
.mph-card-wrapper.active-turn::before {
    content: '';
    position: absolute;
    top: clamp(-24px, -4vmin, -16px);
    left: 50%;
    transform: translateX(-50%);
    width: clamp(14px, 2.5vmin, 22px);
    height: clamp(10px, 2vmin, 16px);
    background-color: currentColor;
    clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
    animation: arrowBob 1.2s infinite ease-in-out;
    filter: drop-shadow(0 0 5px currentColor);
    z-index: 30;
}

@keyframes arrowBob {
    0%, 100% {
        transform: translate(-50%, 0);
    }
    50% {
        transform: translate(-50%, -6px);
    }
}

@keyframes activeLeftGlow {
    0%, 100% {
        filter: drop-shadow(0 0 12px rgba(255, 59, 48, 0.5));
    }
    50% {
        filter: drop-shadow(0 0 24px rgba(255, 59, 48, 0.95));
    }
}

@keyframes activeRightGlow {
    0%, 100% {
        filter: drop-shadow(0 0 12px rgba(0, 168, 255, 0.5));
    }
    50% {
        filter: drop-shadow(0 0 24px rgba(0, 168, 255, 0.95));
    }
}

/* Card Background SVGs */
.mph-card-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
}

/* Animated border shine trail */
.border-shine-path {
    stroke-dasharray: 120 740;
    stroke-dashoffset: 860;
    animation: borderShineMove 3.6s linear infinite;
    opacity: 0;
    transition: opacity 0.4s ease;
}

.active-turn .border-shine-path {
    opacity: 1;
}

.left-border-shine {
    filter: drop-shadow(0 0 4px #FF3B30);
}

.right-border-shine {
    filter: drop-shadow(0 0 4px #00C6FF);
}

@keyframes borderShineMove {
    0% {
        stroke-dashoffset: 860;
    }
    100% {
        stroke-dashoffset: 0;
    }
}

/* Card Contents */
.mph-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
}
.inner-left-align {
    padding-left: clamp(80px, 14.5vmin, 132px);
    padding-right: clamp(48px, 8vmin, 76px);
    align-items: flex-start;
    gap: clamp(2px, 0.5vmin, 6px);
}
.inner-right-align {
    padding-right: clamp(80px, 14.5vmin, 132px);
    padding-left: clamp(48px, 8vmin, 76px);
    align-items: flex-end;
    gap: clamp(2px, 0.5vmin, 6px);
}

.details-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: clamp(1px, 0.4vmin, 4px);
    gap: clamp(6px, 1.5vmin, 12px);
    min-width: 0;
}

.name-badge-row {
    display: flex;
    align-items: center;
    gap: clamp(4px, 0.8vmin, 8px);
    min-width: 0;
    flex: 1;
}
.left-card-wrapper .name-badge-row {
    justify-content: flex-start;
}
.right-card-wrapper .name-badge-row {
    justify-content: flex-end;
}

/* Avatar Design */
.avatar-wrap {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: clamp(56px, 10vmin, 92px);
    height: clamp(56px, 10vmin, 92px);
    z-index: 15;
}
.avatar-left-align {
    left: clamp(12px, 2vmin, 20px);
}
.avatar-right-align {
    right: clamp(12px, 2vmin, 20px);
}

.avatar {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    border: clamp(2.5px, 0.4vmin, 4.5px) solid #FFFFFF;
    background: linear-gradient(135deg, #101525, #050a15);
    box-sizing: border-box;
    transition: all 0.3s ease;
}
.left-card-wrapper .avatar {
    box-shadow: 0 0 12px rgba(255, 59, 48, 0.6);
}
.right-card-wrapper .avatar {
    box-shadow: 0 0 12px rgba(0, 168, 255, 0.6);
}

/* Shine effect */
.avatar::after {
    content: '';
    position: absolute;
    top: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-25deg);
    left: -100%;
    opacity: 0.3;
    pointer-events: none;
    animation: avatarShine 4s infinite ease-in-out;
}
@keyframes avatarShine {
    0% { left: -100%; }
    15% { left: 200%; }
    100% { left: 200%; }
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
.avatar.active {
    animation: pulseAvatar 2s infinite ease-in-out;
}
@keyframes pulseAvatar {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

/* Player Identity */
.player-name {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(10px, 2.2vmin, 22px);
    font-weight: 900;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
}
#mph-my-name {
    text-align: left;
}
#mph-opp-name {
    text-align: right;
}

.you-tag {
    background: #FF3B30;
    font-family: 'Outfit', sans-serif;
    font-size: clamp(9px, 1.4vmin, 13px);
    font-weight: 900;
    color: #FFFFFF;
    padding: clamp(2px, 0.4vmin, 4px) clamp(6px, 1vmin, 10px);
    border-radius: clamp(4px, 0.7vmin, 7px);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1;
    flex-shrink: 0;
}

/* Score */
.score {
    font-family: 'Teko', sans-serif;
    font-size: clamp(44px, 8.5vmin, 78px);
    font-weight: 700;
    color: #FFFFFF;
    line-height: 0.8;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    flex-shrink: 0;
}
.score-bump {
    transform: scale(1.35);
}

/* Attempts Indicator */
.attempts {
    display: flex;
    gap: clamp(4px, 0.8vmin, 8px);
}

.attempts span {
    width: clamp(9px, 1.8vmin, 16px);
    height: clamp(9px, 1.8vmin, 16px);
    border-radius: 50%;
    box-sizing: border-box;
    flex-shrink: 0;
}

.dot-goal {
    background: #00E676; /* Solid glowing green for success */
    box-shadow: 0 0 8px rgba(0, 230, 118, 0.8);
}

.dot-miss {
    background: #FF3B30; /* Solid red for miss */
    box-shadow: 0 0 8px rgba(255, 59, 48, 0.8);
}

.dot-pending {
    background: rgba(255, 255, 255, 0.1);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
}

/* Center Timer Panel */
.timer-panel {
    position: absolute;
    left: 50%;
    bottom: clamp(10px, 2vmin, 20px);
    width: clamp(60px, 12vmin, 100px);
    height: clamp(36px, 7vmin, 58px);
    transform: translateX(-50%) skewX(-25deg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    pointer-events: auto;
    border-radius: clamp(6px, 1vmin, 10px);
    background: linear-gradient(180deg, #07101C, #02060C) padding-box,
                linear-gradient(180deg, #FFD700, #FFA500) border-box;
    border: clamp(1.5px, 0.3vmin, 3px) solid transparent;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.timer-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    transform: skewX(25deg);
}

.timer {
    font-family: 'Teko', sans-serif;
    font-size: clamp(26px, 5vmin, 44px);
    font-weight: 700;
    color: #FFD700;
    line-height: 1;
    text-align: center;
}

.timer.danger {
    color: #FF3B30;
    animation: timerPulse 0.5s infinite ease-in-out;
}

@keyframes timerPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
}

/* Screen Flash */
.mph-flash {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9998;
    opacity: 0;
}

.mph-flash-goal {
    background: radial-gradient(ellipse at center, rgba(255, 59, 48, 0.15) 0%, transparent 70%);
    animation: scoreFlash 0.7s ease-out forwards;
}

.mph-flash-miss {
    background: radial-gradient(ellipse at center, rgba(255, 59, 48, 0.08) 0%, transparent 70%);
    animation: scoreFlash 0.5s ease-out forwards;
}

@keyframes scoreFlash {
    from { opacity: 1; }
    to { opacity: 0; }
}

/* Celebration overlay placed above the card */
.mph-celebration-container {
    position: absolute;
    bottom: calc(100% + 15px); /* sits 15px above the card wrapper */
    left: 50%;
    transform: translateX(-50%);
    width: 160px; /* half size: 320 / 2 */
    height: 320px; /* half size: 640 / 2 */
    pointer-events: none;
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 99999;
}
.mph-celebration-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

@media (max-width: 768px) {
    .mph-glow-line { 
        display: none; 
    }
    
    .mph-card-wrapper {
        width: clamp(180px, 41vw, 290px);
        height: clamp(55px, 12vmin, 80px);
        bottom: clamp(6px, 1.5vmin, 12px);
    }
    
    .left-card-wrapper {
        left: clamp(8px, 2vmin, 20px);
    }
    
    .right-card-wrapper {
        right: clamp(8px, 2vmin, 20px);
    }
    
    .avatar-wrap {
        width: clamp(42px, 9vmin, 58px);
        height: clamp(42px, 9vmin, 58px);
    }
    
    .avatar-left-align {
        left: clamp(6px, 1.2vmin, 10px);
    }
    
    .avatar-right-align {
        right: clamp(6px, 1.2vmin, 10px);
    }
    
    .inner-left-align {
        padding-left: clamp(54px, 11vmin, 74px);
        padding-right: clamp(24px, 5vmin, 36px);
        gap: clamp(1px, 0.3vmin, 3px);
    }
    
    .inner-right-align {
        padding-right: clamp(54px, 11vmin, 74px);
        padding-left: clamp(24px, 5vmin, 36px);
        gap: clamp(1px, 0.3vmin, 3px);
    }
    
    .score {
        font-size: clamp(30px, 6.5vmin, 48px);
    }
    
    .attempts {
        gap: clamp(2px, 0.4vmin, 4px);
    }
    
    .attempts span {
        width: clamp(6px, 1.2vmin, 9px);
        height: clamp(6px, 1.2vmin, 9px);
    }
    
    .timer-panel {
        bottom: clamp(6px, 1.5vmin, 12px);
        width: clamp(50px, 10vmin, 75px);
        height: clamp(28px, 6vmin, 44px);
    }
    
    .timer {
        font-size: clamp(20px, 4.2vmin, 32px);
    }
    
    .mph-card-wrapper.active-turn::before {
        top: clamp(-18px, -3.5vmin, -12px);
        width: clamp(10px, 2vmin, 16px);
        height: clamp(7px, 1.5vmin, 11px);
    }
    
    .mph-celebration-container {
        width: 100px;
        height: 200px;
        bottom: calc(100% + 8px);
    }
}
        `;
        document.head.appendChild(s);
    }

    // =====================================================
    // BUILD DOM
    // =====================================================
    function _buildDOM() {
        var szLeftCelebrationHtml = '';
        var szRightCelebrationHtml = '';
        for (var i = 1; i <= 26; i++) {
            var szNum = (i < 10 ? "00" : "0") + i;
            var szSrc = "./sprites/Celebration/Argentina1/ezgif-frame-" + szNum + ".png";
            szLeftCelebrationHtml += '<img class="mph-celebration-img" id="mph-left-cel-frame-' + i + '" src="' + szSrc + '" style="display:none;" alt="Celebration">';
            szRightCelebrationHtml += '<img class="mph-celebration-img" id="mph-right-cel-frame-' + i + '" src="' + szSrc + '" style="display:none;" alt="Celebration">';
        }

        _el = document.createElement('div');
        _el.id = 'mp-hud';

        _el.innerHTML =
            // Decorative grass glow lines
            '  <div class="mph-glow-line left-glow-line"></div>' +
            '  <div class="mph-glow-line right-glow-line"></div>' +

            // Left Player Panel Wrapper
            '  <div class="mph-card-wrapper left-card-wrapper" id="mph-left">' +
            '    <svg class="mph-card-svg" viewBox="0 0 320 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
            '      <defs>' +
            '        <linearGradient id="left-fill" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '          <stop offset="0%" stop-color="#050505" stop-opacity="0.98"/>' +
            '          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>' +
            '        </linearGradient>' +
            '        <linearGradient id="left-border" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '          <stop offset="0%" stop-color="#FF3B30"/>' +
            '          <stop offset="100%" stop-color="#FF9500"/>' +
            '        </linearGradient>' +
            '        <linearGradient id="left-shine-grad" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '          <stop offset="0%" stop-color="#FF5252"/>' +
            '          <stop offset="100%" stop-color="#FFA500"/>' +
            '        </linearGradient>' +
            '      </defs>' +
            '      <path d="M 2 24 A 22 22 0 0 1 24 2 L 318 2 L 278 88 L 24 88 A 22 22 0 0 1 2 66 Z" fill="url(#left-fill)" stroke="url(#left-border)" stroke-width="3"/>' +
            '      <path class="border-shine-path left-border-shine" d="M 2 24 A 22 22 0 0 1 24 2 L 318 2 L 278 88 L 24 88 A 22 22 0 0 1 2 66 Z" fill="none" stroke="url(#left-shine-grad)" stroke-width="3.5" stroke-linecap="round"/>' +
            '    </svg>' +
            '    <div class="mph-card-inner inner-left-align">' +
            '      <div class="details-top">' +
            '        <div class="name-badge-row">' +
            '          <span class="player-name" id="mph-my-name"></span>' +
            '          <span class="you-tag">YOU</span>' +
            '        </div>' +
            '        <div class="score" id="mph-my-score">0</div>' +
            '      </div>' +
            '      <div class="attempts" id="mph-my-dots"></div>' +
            '    </div>' +
            '    <div class="avatar-wrap avatar-left-align">' +
            '      <div class="avatar" id="mph-my-avatar-container">' +
            '        <img src="' + _szMyAvatar + '" onerror="this.onerror=null;this.src=\'sprites/Avatars/default.png\';" draggable="false" alt="Avatar">' +
            '      </div>' +
            '    </div>' +
            '    <div class="mph-celebration-container" id="mph-left-celebration">' +
           szLeftCelebrationHtml +
    '    </div>' +
    '  </div>' +

            // Center Timer Panel
            '  <div class="timer-panel">' +
            '    <div class="timer-inner">' +
            '      <div class="timer" id="mph-timer">—</div>' +
            '    </div>' +
            '  </div>' +

            // Right Opponent Panel Wrapper
            '  <div class="mph-card-wrapper right-card-wrapper" id="mph-right">' +
            '    <svg class="mph-card-svg" viewBox="0 0 320 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
            '      <defs>' +
            '        <linearGradient id="right-fill" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '          <stop offset="0%" stop-color="#050505" stop-opacity="0.98"/>' +
            '          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>' +
            '        </linearGradient>' +
            '        <linearGradient id="right-border" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '          <stop offset="0%" stop-color="#00A8FF"/>' +
            '          <stop offset="100%" stop-color="#00C6FF"/>' +
            '        </linearGradient>' +
            '        <linearGradient id="right-shine-grad" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '          <stop offset="0%" stop-color="#00E5FF"/>' +
            '          <stop offset="100%" stop-color="#00A8FF"/>' +
            '        </linearGradient>' +
            '      </defs>' +
            '      <path d="M 42 2 L 296 2 A 22 22 0 0 1 318 24 L 318 66 A 22 22 0 0 1 296 88 L 2 88 L 42 2 Z" fill="url(#right-fill)" stroke="url(#right-border)" stroke-width="3"/>' +
            '      <path class="border-shine-path right-border-shine" d="M 42 2 L 296 2 A 22 22 0 0 1 318 24 L 318 66 A 22 22 0 0 1 296 88 L 2 88 L 42 2 Z" fill="none" stroke="url(#right-shine-grad)" stroke-width="3.5" stroke-linecap="round"/>' +
            '    </svg>' +
            '    <div class="mph-card-inner inner-right-align">' +
            '      <div class="details-top">' +
            '        <div class="score" id="mph-opp-score">0</div>' +
            '        <div class="name-badge-row">' +
            '          <span class="player-name" id="mph-opp-name"></span>' +
            '          <span class="you-tag" style="display:none;">YOU</span>' +
            '        </div>' +
            '      </div>' +
            '      <div class="attempts" id="mph-opp-dots"></div>' +
            '    </div>' +
            '    <div class="avatar-wrap avatar-right-align">' +
            '      <div class="avatar" id="mph-opp-avatar-container">' +
            '        <img src="' + _szOppAvatar + '" onerror="this.onerror=null;this.src=\'sprites/Avatars/default.png\';" draggable="false" alt="Avatar">' +
            '      </div>' +
            '    </div>' +
            '    <div class="mph-celebration-container" id="mph-right-celebration">' +
           szRightCelebrationHtml +
    '    </div>' +
    '  </div>';

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
            var cls = '';
            if (i < shots.length) {
                cls = shots[i] === 'goal' ? 'dot-goal' : 'dot-miss';
            } else {
                cls = 'dot-pending';
            }
            html += '<span class="' + cls + '"></span>';
        }
        el.innerHTML = html;
    }

    // =====================================================
    // FLASH SCREEN
    // =====================================================
    function _flash(goal) {

        var f = document.createElement('div');
        f.className = 'mph-flash ' + (goal ? 'mph-flash-goal' : 'mph-flash-miss');
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
        _szMyAvatar = myAvatar || 'sprites/Avatars/default.png';
        _szOppAvatar = oppAvatar || 'sprites/Avatars/default.png';

        _iMaxShots = maxShots || 10;

        _buildDOM();
    };

    this.setTurn = function (myTurn) {

        var left = document.getElementById('mph-left');
        var right = document.getElementById('mph-right');
        
        var myAvatar = document.getElementById('mph-my-avatar-container');
        var oppAvatar = document.getElementById('mph-opp-avatar-container');
        var turn = document.getElementById('mph-turn');

        if (!left || !right || !myAvatar || !oppAvatar) return;

        if (myTurn) {
            left.classList.add('active-turn');
            right.classList.remove('active-turn');
            
            myAvatar.classList.add('active');
            oppAvatar.classList.remove('active');

            if (turn) {
                turn.textContent = 'YOUR TURN';
                turn.className = 'turn-indicator turn-mine';
            }
        } else {
            right.classList.add('active-turn');
            left.classList.remove('active-turn');
            
            oppAvatar.classList.add('active');
            myAvatar.classList.remove('active');

            if (turn) {
                turn.textContent = 'OPP TURN';
                turn.className = 'turn-indicator turn-opp';
            }
        }
    };

    this.setTimer = function (sec) {

        var el = document.getElementById('mph-timer');
        if (!el) return;

        el.textContent = sec + 's';
        el.className = 'timer';

        if (sec <= 5) {
            el.classList.add('danger');
        }
    };

    this.setScore = function (myGoals, oppGoals) {

        var elMy = document.getElementById('mph-my-score');
        var elOpp = document.getElementById('mph-opp-score');

        if (elMy && elMy.textContent != myGoals) {
            elMy.textContent = myGoals;
            elMy.classList.add('score-bump');
            setTimeout(function() { elMy.classList.remove('score-bump'); }, 200);
        }

        if (elOpp && elOpp.textContent != oppGoals) {
            elOpp.textContent = oppGoals;
            elOpp.classList.add('score-bump');
            setTimeout(function() { elOpp.classList.remove('score-bump'); }, 200);
        }
    };

    this.recordShot = function (wasMe, goal) {

        if (wasMe) {
            _aMyShots.push(goal ? 'goal' : 'miss');
            _renderDots('mph-my-dots', _aMyShots, _iMaxShots);
        } else {
            _aOppShots.push(goal ? 'goal' : 'miss');
            _renderDots('mph-opp-dots', _aOppShots, _iMaxShots);
        }

        _flash(goal);
    };

    this.showResult = function (txt) {

        var turn = document.getElementById('mph-turn');
        if (turn) {
            turn.textContent = txt;
            turn.className = 'turn-indicator turn-wait';
        }
    };

    this.getMyShots = function () {
        return _aMyShots;
    };

    this.getOppShots = function () {
        return _aOppShots;
    };

    var _iCelebrationTimer = null;
    var _iCelFrame = 1;
    var _bCelPlaying = false;
    var _elActiveCelContainer = null;

    this.playCelebration = function (bIsMe) {
        this.stopCelebration();

        var szPrefix = bIsMe ? "mph-left" : "mph-right";
        _elActiveCelContainer = document.getElementById(szPrefix + "-celebration");

        if (!_elActiveCelContainer) {
            return;
        }

        _iCelFrame = 1;
        _bCelPlaying = true;

        for (var i = 1; i <= 26; i++) {
            var elFrame = document.getElementById(szPrefix + "-cel-frame-" + i);
            if (elFrame) {
                elFrame.style.display = "none";
            }
        }

        var elFirstFrame = document.getElementById(szPrefix + "-cel-frame-" + _iCelFrame);
        if (elFirstFrame) {
            elFirstFrame.style.display = "block";
        }

        _elActiveCelContainer.style.display = "flex";
        _elActiveCelContainer.style.opacity = "1";
        _elActiveCelContainer.style.transition = "none";

        var iFrameRateMs = 80; // 60ms loop speed for smooth, natural playback
        var iDurationMs = 3000;
        var iElapsedMs = 0;

        var self = this;
        _iCelebrationTimer = setInterval(function () {
            iElapsedMs += iFrameRateMs;
            if (iElapsedMs >= iDurationMs) {
                self.stopCelebration();
                return;
            }

            if (iElapsedMs >= iDurationMs - 500) {
                var fAlpha = (iDurationMs - iElapsedMs) / 500;
                _elActiveCelContainer.style.transition = "opacity 0.04s linear";
                _elActiveCelContainer.style.opacity = fAlpha.toFixed(2);
            }

            var elOld = document.getElementById(szPrefix + "-cel-frame-" + _iCelFrame);
            if (elOld) {
                elOld.style.display = "none";
            }

            _iCelFrame = (_iCelFrame % 26) + 1;

            var elNew = document.getElementById(szPrefix + "-cel-frame-" + _iCelFrame);
            if (elNew) {
                elNew.style.display = "block";
            }
        }, iFrameRateMs);
    };

    this.stopCelebration = function () {
        if (_iCelebrationTimer) {
            clearInterval(_iCelebrationTimer);
            _iCelebrationTimer = null;
        }
        if (_elActiveCelContainer) {
            _elActiveCelContainer.style.display = "none";
            _elActiveCelContainer.style.opacity = "0";

            var szPrefix = _elActiveCelContainer.id.indexOf("left") !== -1 ? "mph-left" : "mph-right";
            for (var i = 1; i <= 26; i++) {
                var elFrame = document.getElementById(szPrefix + "-cel-frame-" + i);
                if (elFrame) {
                    elFrame.style.display = "none";
                }
            }
            _elActiveCelContainer = null;
        }
        _bCelPlaying = false;
    };

    this.unload = function () {
        this.stopCelebration();

        if (_el && _el.parentNode) {
            _el.parentNode.removeChild(_el);
        }
        _el = null;
    };

    return this;
}

window.CMpHUD = CMpHUD;

var s_oMpHUD = null;