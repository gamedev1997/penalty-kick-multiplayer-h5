// ─── CWinPanel.js ─────────────────────────────────────────────────────────────
// Single-player game-over screen rendered as a premium HTML overlay.
// Matches the CMpWinPanel.js esports visual layout.
// ─────────────────────────────────────────────────────────────────────────────

function CWinPanel(oSpriteBg) {

    var _el = null;   // the overlay <div>

    // ── Build & inject CSS (once) ─────────────────────────────────────────────
    function _injectStyles() {
        if (document.getElementById('win-styles')) return;
        var style = document.createElement('style');
        style.id = 'win-styles';
        style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');

#mpwin-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; font-family: 'Outfit', Arial, sans-serif;
    overflow: hidden; padding: 16px; box-sizing: border-box;
}

.mpwin-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 30%, #051c36 0%, #020813 100%);
    overflow: hidden;
}

/* Stadium lights background beam overlay */
.stadium-light {
    position: absolute;
    top: -15%;
    width: 600px;
    height: 1000px;
    background: radial-gradient(circle at top, rgba(0, 229, 255, 0.12) 0%, transparent 60%);
    transform-origin: top center;
    filter: blur(20px);
    pointer-events: none;
}
.light-left {
    left: 5%;
    transform: rotate(-15deg);
    animation: swingLeft 9s infinite alternate ease-in-out;
}
.light-right {
    right: 5%;
    background: radial-gradient(circle at top, rgba(255, 68, 68, 0.08) 0%, transparent 60%);
    transform: rotate(15deg);
    animation: swingRight 9s infinite alternate ease-in-out;
}
@keyframes swingLeft {
    0% { transform: rotate(-22deg); }
    100% { transform: rotate(-8deg); }
}
@keyframes swingRight {
    0% { transform: rotate(8deg); }
    100% { transform: rotate(22deg); }
}

.confetti-piece {
    position: absolute;
    transform-origin: center;
    pointer-events: none;
    border-radius: 2px;
}
@keyframes confettiFall {
    0% { transform: translateY(-50px) rotate(0deg); }
    100% { transform: translateY(110vh) rotate(720deg); }
}

/* Glassmorphism Main Card */
.mpwin-card {
    position: relative; z-index: 1;
    background: rgba(3, 11, 25, 0.85);
    border: 2px solid rgba(255, 215, 0, 0.35);
    border-radius: 28px;
    padding: 40px;
    width: min(640px, 100%);
    max-height: calc(100vh - 32px);
    display: flex; flex-direction: column; gap: 24px;
    overflow-y: auto;
    box-shadow: 
        0 24px 80px rgba(0,0,0,0.8), 
        0 0 40px rgba(255, 215, 0, 0.15),
        inset 0 0 20px rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    animation: mpwinCardIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    box-sizing: border-box;
}

@keyframes mpwinCardIn {
    from { opacity: 0; transform: scale(0.85) translateY(30px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header Wreath + Trophy */
.mpwin-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
.full-time-tag {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 4px 14px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
}
.trophy-wrapper {
    position: relative;
    width: 200px;
    height: 90px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.laurel-wreath-svg {
    position: absolute;
    width: 180px;
    height: 110px;
    top: -10px;
    opacity: 0.85;
}
.trophy-svg {
    width: 70px;
    height: 70px;
    z-index: 2;
    filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.3));
    animation: trophyGlow 3s infinite alternate ease-in-out;
}
@keyframes trophyGlow {
    0% { filter: drop-shadow(0 4px 10px rgba(255, 215, 0, 0.3)); }
    100% { filter: drop-shadow(0 4px 22px rgba(255, 215, 0, 0.6)); }
}

.mpwin-title {
    font-family: 'Teko', sans-serif;
    font-size: 64px;
    font-weight: 800;
    line-height: 0.9;
    margin: 4px 0 0 0;
    text-transform: uppercase;
    text-align: center;
    letter-spacing: 1px;
    /* 3D Extrusion appearance using CSS text-shadow */
    text-shadow: 
        0 1px 0 #020B1E,
        0 2px 0 #020B1E,
        0 3px 0 #020B1E,
        0 4px 0 #020B1E,
        0 5px 0 #020B1E,
        0 8px 12px rgba(0, 0, 0, 0.8);
}

.title-win {
    background: linear-gradient(180deg, #FFF3A8 0%, #FFD700 45%, #FFA500 50%, #FF8C00 51%, #FFB300 85%, #B37400 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.title-lose {
    background: linear-gradient(180deg, #FFAAAA 0%, #FF3B30 45%, #D32F2F 50%, #C01010 51%, #990000 85%, #660000 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.title-tie {
    background: linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 45%, #BDBDBD 50%, #9E9E9E 51%, #757575 85%, #424242 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Score Section */
.mpwin-score-sec {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 24px 36px;
    position: relative;
    overflow: hidden;
}
.team-aura {
    position: absolute;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.25;
    pointer-events: none;
}
.aura-player {
    left: -20px;
    top: -20px;
    background: #00E5FF;
}
.aura-opponent {
    right: -20px;
    top: -20px;
    background: #FF3B30;
}

.score-team {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 35%;
    z-index: 1;
}
.team-badge {
    width: 72px;
    height: 72px;
    filter: drop-shadow(0 6px 15px rgba(0, 0, 0, 0.4));
}
.team-name {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}
.score-display {
    font-family: 'Teko', sans-serif;
    font-size: 80px;
    font-weight: 800;
    color: #ffffff;
    text-align: center;
    width: 30%;
    z-index: 1;
    letter-spacing: 2px;
    text-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    line-height: 1;
}

/* Stats Section */
.mpwin-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}
.stat-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.3s ease;
}
.stat-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.10);
    transform: translateY(-2px);
}
.stat-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
}
.stat-value {
    font-family: 'Teko', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
}
.stat-highlight {
    background: rgba(255, 215, 0, 0.04);
    border-color: rgba(255, 215, 0, 0.15);
}
.stat-highlight .stat-label {
    color: #FFD700;
}
.stat-highlight .stat-value {
    color: #FFD700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

/* Action Buttons */
.mpwin-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
}
.btn {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-sizing: border-box;
}
.btn-primary {
    flex-grow: 2;
    padding: 18px 24px;
    font-size: 16px;
    background: linear-gradient(135deg, #FFD700 0%, #FF9F00 100%);
    color: #020813;
    box-shadow: 
        0 6px 20px rgba(255, 165, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    position: relative;
    overflow: hidden;
}
.btn-primary::after {
    content: '';
    position: absolute;
    top: 0; left: -50%;
    width: 20%; height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
    transform: skewX(-25deg);
    animation: btnShine 3s infinite;
}
@keyframes btnShine {
    0% { left: -50%; }
    100% { left: 150%; }
}
.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 
        0 8px 25px rgba(255, 165, 0, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
    filter: brightness(1.08);
}
.btn-primary:active {
    transform: translateY(1px);
}

.btn-secondary {
    padding: 16px 24px;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
}
.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: translateY(-1px);
}
.btn-secondary:active {
    transform: translateY(1px);
}

.mpwin-hint {
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 1px;
    margin: 4px 0 0 0;
}

/* Landscape / Mobile responsiveness */
@media (max-height: 540px) {
    .mpwin-card {
        padding: 20px 24px;
        gap: 12px;
        border-radius: 20px;
    }
    .mpwin-title {
        font-size: 40px;
    }
    .trophy-wrapper {
        height: 60px;
        width: 140px;
    }
    .trophy-svg {
        width: 44px;
        height: 44px;
    }
    .laurel-wreath-svg {
        width: 110px;
        height: 80px;
    }
    .mpwin-score-sec {
        padding: 12px 20px;
    }
    .team-badge {
        width: 48px;
        height: 48px;
    }
    .score-display {
        font-size: 48px;
    }
    .team-name {
        font-size: 13px;
    }
    .stat-card {
        padding: 8px 12px;
    }
    .stat-value {
        font-size: 24px;
    }
    .btn {
        padding: 12px 18px;
    }
    .btn-primary {
        font-size: 14px;
    }
}
        `;
        document.head.appendChild(style);
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    this._init = function () {
        _injectStyles();
    };

    // ── Show result overlay ───────────────────────────────────────────────────
    this.show = function (iScore) {
        var myGoals = iScore;
        var totalShots = typeof NUM_OF_PENALTY !== 'undefined' ? NUM_OF_PENALTY : 15;
        var oppGoals = totalShots - myGoals; // goalkeeper saves

        // Evaluate win/lose state based on scoring logic
        var result = 'draw';
        if (myGoals > oppGoals) {
            result = 'win';
        } else if (myGoals < oppGoals) {
            result = 'lose';
        }

        // Title and config setups
        var szTitleClass = 'title-win';
        var szTitleText = 'YOU WIN!';
        var borderGlowColor = 'rgba(255, 215, 0, 0.35)';

        if (result === 'lose') {
            szTitleClass = 'title-lose';
            szTitleText = 'GAME OVER';
            borderGlowColor = 'rgba(255, 68, 68, 0.25)';
        } else if (result === 'draw') {
            szTitleClass = 'title-tie';
            szTitleText = 'MATCH TIE';
            borderGlowColor = 'rgba(255, 255, 255, 0.2)';
        }

        // Statistics math
        var iAccuracy = myGoals > 0 ? Math.round((myGoals / totalShots) * 100) : 0;
        var iCoins = myGoals * 15;
        var iXP = myGoals * 5;
        var iTrophies = 0;
        var szTrophySign = '';

        if (result === 'win') {
            iTrophies = 10;
            szTrophySign = '+';
        } else if (result === 'lose') {
            iTrophies = 5;
            szTrophySign = '-';
        } else {
            iTrophies = 0;
            szTrophySign = '+';
        }

        _el = document.createElement('div');
        _el.id = 'mpwin-overlay';
        _el.innerHTML = `
            <div class="mpwin-bg">
                <div class="stadium-light light-left"></div>
                <div class="stadium-light light-right"></div>
                <div class="confetti-container" id="confetti-container"></div>
            </div>
            
            <div class="mpwin-card" style="border-color: ${borderGlowColor}; box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 40px ${borderGlowColor}, inset 0 0 20px rgba(255, 255, 255, 0.03);">
                <!-- Header -->
                <div class="mpwin-header">
                    <div class="full-time-tag">FULL TIME</div>
                    <div class="trophy-wrapper">
                        <!-- Left & Right Laurel Wreath SVGs -->
                        <svg class="laurel-wreath-svg" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Left Wreath branch -->
                            <path d="M70,80 C50,75 35,60 35,40 C35,25 45,15 55,10" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                            <path d="M35,40 C30,38 28,30 32,28 C36,26 38,34 35,40 Z" fill="#FFD700"/>
                            <path d="M42,52 C36,49 32,42 37,39 C42,36 44,45 42,52 Z" fill="#FFD700"/>
                            <path d="M49,63 C43,60 41,51 46,48 C51,45 52,55 49,63 Z" fill="#FFD700"/>
                            <path d="M38,28 C34,24 33,18 38,17 C43,16 43,24 38,28 Z" fill="#FFD700"/>
                            <path d="M48,18 C44,14 45,8 49,9 C53,10 52,16 48,18 Z" fill="#FFD700"/>
                            
                            <!-- Right Wreath branch -->
                            <path d="M130,80 C150,75 165,60 165,40 C165,25 155,15 145,10" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/>
                            <path d="M165,40 C170,38 172,30 168,28 C164,26 162,34 165,40 Z" fill="#FFD700"/>
                            <path d="M158,52 C164,49 168,42 163,39 C158,36 156,45 158,52 Z" fill="#FFD700"/>
                            <path d="M151,63 C157,60 159,51 154,48 C149,45 148,55 151,63 Z" fill="#FFD700"/>
                            <path d="M162,28 C166,24 167,18 162,17 C157,16 157,24 162,28 Z" fill="#FFD700"/>
                            <path d="M152,18 C156,14 155,8 151,9 C147,10 148,16 152,18 Z" fill="#FFD700"/>
                        </svg>
                        
                        <!-- Trophy SVG -->
                        <svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 18C12 12 16 10 20 10H44C48 10 52 12 52 18C52 28 46 32 38 34C36 38 34 42 34 46V50H40V54H24V50H30V46C30 42 28 38 26 34C18 32 12 28 12 18Z" fill="url(#trophyGrad)" stroke="#B37400" stroke-width="1.5"/>
                            <path d="M12 18H8C4 18 2 15 2 12C2 8 6 6 8 6H12V18Z" fill="url(#trophyGrad)" stroke="#B37400" stroke-width="1.5"/>
                            <path d="M52 18H56C60 18 62 15 62 12C62 8 58 6 56 6H52V18Z" fill="url(#trophyGrad)" stroke="#B37400" stroke-width="1.5"/>
                            <circle cx="32" cy="22" r="6" fill="#FFF3A8"/>
                            <defs>
                                <linearGradient id="trophyGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="#FFF3A8"/>
                                    <stop offset="50%" stop-color="#FFD700"/>
                                    <stop offset="100%" stop-color="#B37400"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div class="mpwin-title ${szTitleClass}">${szTitleText}</div>
                </div>
                
                <!-- Score Element -->
                <div class="mpwin-score-sec">
                    <div class="team-aura aura-player"></div>
                    <div class="team-aura aura-opponent"></div>
                    
                    <div class="score-team">
                        <!-- Player SVG Shield Badge -->
                        <svg class="team-badge" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                            <path d="M32 4L6 14V30C6 44 17 54 32 58C47 54 58 44 58 30V14L32 4Z" fill="url(#blueShield)" stroke="#00E5FF" stroke-width="2"/>
                            <circle cx="32" cy="30" r="12" fill="#00162B" stroke="#00E5FF" stroke-width="1.5"/>
                            <path d="M26 30H38 M32 24V36" stroke="#00E5FF" stroke-width="2" stroke-linecap="round"/>
                            <defs>
                                <linearGradient id="blueShield" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="#0059B3"/>
                                    <stop offset="100%" stop-color="#00162B"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="team-name">Player</div>
                    </div>
                    
                    <div class="score-display">${myGoals} - ${oppGoals}</div>
                    
                    <div class="score-team">
                        <!-- Goalkeeper SVG Shield Badge -->
                        <svg class="team-badge" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                            <path d="M32 4L6 14V30C6 44 17 54 32 58C47 54 58 44 58 30V14L32 4Z" fill="url(#redShield)" stroke="#FF3B30" stroke-width="2"/>
                            <circle cx="32" cy="30" r="12" fill="#170500" stroke="#FF3B30" stroke-width="1.5"/>
                            <path d="M26 30H38" stroke="#FF3B30" stroke-width="2" stroke-linecap="round"/>
                            <defs>
                                <linearGradient id="redShield" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="#990000"/>
                                    <stop offset="100%" stop-color="#170500"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="team-name">Goalkeeper</div>
                    </div>
                </div>
                
                <!-- Stats Section -->
                <div class="mpwin-stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">Accuracy</span>
                        <span class="stat-value">${iAccuracy}%</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Goals</span>
                        <span class="stat-value">${myGoals}</span>
                    </div>
                    <div class="stat-card stat-highlight">
                        <span class="stat-label">Coins</span>
                        <span class="stat-value">+${iCoins}</span>
                    </div>
                    <div class="stat-card stat-highlight">
                        <span class="stat-label">XP</span>
                        <span class="stat-value">+${iXP}</span>
                    </div>
                    <div class="stat-card stat-highlight">
                        <span class="stat-label">Trophies</span>
                        <span class="stat-value">${szTrophySign}${iTrophies}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Best Score</span>
                        <span class="stat-value">${s_iBestScore}</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="mpwin-actions">
                    <button class="btn btn-secondary" id="btn-home">HOME</button>
                    <button class="btn btn-primary" id="btn-rematch">REMATCH</button>
                    <button class="btn btn-secondary" id="btn-next">NEXT</button>
                </div>
                
                <p class="mpwin-hint">— exit or play again —</p>
            </div>
        `;

        document.body.appendChild(_el);

        // Bind interactive events
        var self = this;
        $(_el).find('#btn-rematch').on('click', function () {
            self.unload();
            if (s_oGame) {
                s_oGame.restartGame();
            }
        });

        $(_el).find('#btn-home, #btn-next').on('click', function () {
            self.unload();
            if (s_oGame) {
                s_oGame.onExit();
            }
        });

        // Trigger confetti injection (only on Victory)
        if (result === 'win') {
            var container = $(_el).find('#confetti-container')[0];
            if (container) {
                for (var i = 0; i < 60; i++) {
                    var piece = document.createElement('div');
                    piece.className = 'confetti-piece';
                    piece.style.left = Math.random() * 100 + '%';
                    piece.style.top = -10 - Math.random() * 20 + 'px';
                    piece.style.backgroundColor = ['#FFD700', '#FFA500', '#FFF3A8', '#FF8C00', '#B37400'][Math.floor(Math.random() * 5)];
                    piece.style.width = 6 + Math.random() * 8 + 'px';
                    piece.style.height = 12 + Math.random() * 10 + 'px';
                    piece.style.animation = 'confettiFall ' + (2.5 + Math.random() * 3) + 's linear infinite';
                    piece.style.animationDelay = Math.random() * 2.2 + 's';
                    piece.style.opacity = 0.6 + Math.random() * 0.4;
                    container.appendChild(piece);
                }
            }
        }

        $(s_oMain).trigger("save_score", iScore);
        $(s_oMain).trigger("share_event", iScore);
    };

    // ── Unload ────────────────────────────────────────────────────────────────
    this.unload = function () {
        if (_el && _el.parentNode) {
            document.body.removeChild(_el);
            _el = null;
        }
    };

    this._init(oSpriteBg);
    return this;
}