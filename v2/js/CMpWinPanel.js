// ─── CMpWinPanel.js ───────────────────────────────────────────────────────────
// Multiplayer game-over screen rendered as an HTML overlay — same visual style
// as CModeSelect (dark BG + glassmorphism card + Outfit font).
// ─────────────────────────────────────────────────────────────────────────────

function CMpWinPanel() {

    var _el = null;   // the overlay <div>

    // ── Build & inject CSS (once) ─────────────────────────────────────────────
    function _injectStyles() {
        if (document.getElementById('mpwin-styles')) return;
        var style = document.createElement('style');
        style.id = 'mpwin-styles';
        style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');

#mpwin-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; font-family: 'Outfit', Arial, sans-serif;
    overflow: hidden; padding: 8px; box-sizing: border-box;
    animation: mpwinFadeIn 0.4s ease-out both;
}
@keyframes mpwinFadeIn { from { opacity:0; } to { opacity:1; } }

/* Same BG as mode screen */
.mpwin-bg {
    position: absolute; inset: 0;
    background:
        radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.12) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.10) 0%, transparent 60%),
        linear-gradient(160deg, #020c18 0%, #051a2e 50%, #0a1628 100%);
}
.mpwin-bg::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
        repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px),
        repeating-linear-gradient(0deg,  rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px);
}

/* Glassmorphism card — same as .ms-card */
.mpwin-card {
    position: relative; z-index: 1;
    background: rgba(5, 20, 40, 0.88);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 24px;
    padding: 32px 36px 28px;
    width: min(480px, 100%);
    max-height: calc(100vh - 16px);
    display: flex; flex-direction: column; gap: 18px;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.06);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    animation: mpwinCardIn 0.45s ease-out both;
    box-sizing: border-box;
}
@keyframes mpwinCardIn {
    from { opacity:0; transform: scale(0.9); }
    to   { opacity:1; transform: scale(1); }
}

/* Top accent bar — colour set via inline style */
.mpwin-accent {
    height: 3px; border-radius: 2px;
    margin: -32px -36px 0; /* bleed to card edges */
}

/* Result headline */
.mpwin-result {
    text-align: center;
}
.mpwin-result-text {
    font-size: 42px; font-weight: 800; letter-spacing: 4px;
    display: block; margin-bottom: 4px;
    text-shadow: 0 0 30px currentColor;
}
.mpwin-result-sub {
    font-size: 14px; font-weight: 500; letter-spacing: 2px;
    color: rgba(255,255,255,0.45); text-transform: uppercase;
}

/* Divider */
.mpwin-divider {
    height: 1px; background: rgba(255,255,255,0.08);
    margin: 0 -4px;
}

/* Leaderboard table */
.mpwin-table {
    width: 100%; border-collapse: collapse;
    font-size: 15px;
}
.mpwin-table th {
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    color: rgba(255,255,255,0.35); text-transform: uppercase;
    padding: 8px 12px; text-align: center;
    background: transparent;
}
.mpwin-table th:first-child { text-align: left; padding-left: 14px; }
.mpwin-table th:last-child  { text-align: right; padding-right: 14px; }

.mpwin-table td {
    padding: 14px 12px; text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.75);
    font-weight: 600;
}
.mpwin-table td:first-child { text-align: left; padding-left: 14px; }
.mpwin-table td:last-child  { text-align: right; padding-right: 14px; }

/* "Me" row highlight */
.mpwin-row-me td {
    background: rgba(255,215,0,0.08);
    color: #FFD700;
    font-weight: 600;
}
.mpwin-row-me td:first-child {
    border-left: 3px solid #FFD700;
    padding-left: 11px;
}

/* Goal count — larger */
.mpwin-goals {
    font-size: 22px; font-weight: 800;
}
.mpwin-row-me .mpwin-goals { color: #FFD700; }

/* Rank badge */
.mpwin-rank {
    display: inline-block;
    font-size: 13px; font-weight: 700; letter-spacing: 1px;
    padding: 2px 8px; border-radius: 20px;
}
.mpwin-rank-1 { background: rgba(255,215,0,0.15); color: #FFD700; }
.mpwin-rank-2 { background: rgba(176,176,176,0.12); color: #b0b0b0; }
.mpwin-rank-tie { background: rgba(96,207,255,0.12); color: #60cfff; }

/* Hint */
.mpwin-hint {
    text-align: center;
    font-size: 12px; color: rgba(255,255,255,0.22);
    letter-spacing: 1px;
    margin-top: -4px;
}

/* Landscape compact */
@media (max-height: 500px) {
    .mpwin-card { padding: 14px 20px; gap: 10px; border-radius: 16px; }
    .mpwin-result-text { font-size: 28px; }
    .mpwin-result-sub  { display: none; }
    .mpwin-table td, .mpwin-table th { padding: 8px 10px; }
    .mpwin-goals { font-size: 16px; }
    .mpwin-hint  { display: none; }
    .mpwin-accent { margin: -14px -20px 0; }
}
        `;
        document.head.appendChild(style);
    }

    // ── Init (called by CInterface) ───────────────────────────────────────────
    this._init = function () {
        _injectStyles();
    };

    // ── Show result overlay ───────────────────────────────────────────────────
    // oResult = { result: 'win'|'lose'|'draw', players: [{rank, name, goals, isMe}] }
    this.show = function (oResult) {
        var result = oResult.result || 'draw';
        var players = oResult.players || [];

        // Result config
        var szText, szColor, szSub, szAccentGrad;
        if (result === 'win') {
            szText = 'YOU WIN!';
            szColor = '#FFD700';
            szSub = 'Congratulations!';
            szAccentGrad = 'linear-gradient(90deg, transparent, #FFD700, transparent)';
        } else if (result === 'lose') {
            szText = 'YOU LOSE';
            szColor = '#ff4444';
            szSub = 'Better luck next time!';
            szAccentGrad = 'linear-gradient(90deg, transparent, #ff4444, transparent)';
        } else {
            szText = 'MATCH TIE';
            szColor = '#60cfff';
            szSub = "What a match!";
            szAccentGrad = 'linear-gradient(90deg, transparent, #60cfff, transparent)';
        }

        // Build leaderboard rows
        var szRows = '';
        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            var isMe = (p.isMe === true);
            var isDraw = (result === 'draw');

            var szRankBadge;
            if (isDraw) {
                szRankBadge = '<span class="mpwin-rank mpwin-rank-tie">TIE</span>';
            } else if (p.rank === 1) {
                szRankBadge = '<span class="mpwin-rank mpwin-rank-1">#1</span>';
            } else {
                szRankBadge = '<span class="mpwin-rank mpwin-rank-2">#2</span>';
            }

            var szRowClass = isMe ? ' class="mpwin-row-me"' : '';
            szRows +=
                '<tr' + szRowClass + '>' +
                '<td>' + szRankBadge + '</td>' +
                '<td>' + (p.name || '?') + (isMe ? ' <small style="opacity:0.5;font-size:11px">(you)</small>' : '') + '</td>' +
                '<td><span class="mpwin-goals">' + (p.goals !== undefined ? p.goals : 0) + '</span></td>' +
                '</tr>';
        }

        _el = document.createElement('div');
        _el.id = 'mpwin-overlay';
        _el.innerHTML =
            '<div class="mpwin-bg"></div>' +
            '<div class="mpwin-card">' +
            '  <div class="mpwin-accent" style="background:' + szAccentGrad + '"></div>' +
            '  <div class="mpwin-result">' +
            '    <span class="mpwin-result-text" style="color:' + szColor + '">' + szText + '</span>' +
            '    <span class="mpwin-result-sub">' + szSub + '</span>' +
            '  </div>' +
            '  <div class="mpwin-divider"></div>' +
            '  <table class="mpwin-table">' +
            '    <thead><tr>' +
            '      <th>RANK</th><th>PLAYER</th><th>GOALS</th>' +
            '    </tr></thead>' +
            '    <tbody>' + szRows + '</tbody>' +
            '  </table>' +
            '  <div class="mpwin-divider"></div>' +
            '  <p class="mpwin-hint">— returning to lobby —</p>' +
            '</div>';

        document.body.appendChild(_el);
    };

    // ── Unload ────────────────────────────────────────────────────────────────
    this.unload = function () {
        if (_el && _el.parentNode) {
            document.body.removeChild(_el);
            _el = null;
        }
    };

    this._init();
    return this;
}
