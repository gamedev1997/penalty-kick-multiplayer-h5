// ─── CMpWinPanel.js ───────────────────────────────────────────────────────────
// Premium FIFA Mobile / EA FC Mobile style Match Result screen.
// Broadcast-quality layout with player avatars, hero score, metallic shine
// sweeps, three distinct outcomes (WIN / LOSE / TIE), and lobby redirect.
// ─────────────────────────────────────────────────────────────────────────────

function CMpWinPanel() {

    var _el = null;

    function _injectStyles() {
        return; // Disabled in favor of _injectNewStyles()
        if (document.getElementById('mpwin-styles')) return;
        var style = document.createElement('style');
        style.id = 'mpwin-styles';
        style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Bebas+Neue&display=swap');

/* ─── OVERLAY ─── */
#mpwin-overlay {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    font-family: 'Teko', 'Bebas Neue', Arial, sans-serif;
    overflow: hidden;
    padding: 12px;
    box-sizing: border-box;
}

/* ─── BACKGROUND ─── */
.mpwin-bg {
    position: absolute; inset: 0;
    overflow: hidden;
}
.outcome-win  .mpwin-bg { background: radial-gradient(ellipse at 50% 30%, #1a2f4a 0%, #0a1628 50%, #050a14 100%); }
.outcome-lose .mpwin-bg { background: radial-gradient(ellipse at 50% 30%, #2a0e14 0%, #0f0a18 50%, #050a14 100%); }
.outcome-draw .mpwin-bg { background: radial-gradient(ellipse at 50% 30%, #0c2240 0%, #081228 50%, #050a14 100%); }

/* Vignette */
.mpwin-bg::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%);
    pointer-events: none;
}

/* Stadium flood-light beams */
.stadium-beam {
    position: absolute;
    top: -30%;
    width: 350px;
    height: 1000px;
    transform-origin: top center;
    pointer-events: none;
    opacity: 0;
    animation: beamFadeIn 1.5s 0.2s ease-out forwards;
}
@keyframes beamFadeIn { to { opacity: 1; } }
.beam-1 { left: -8%;  transform: rotate(-22deg); }
.beam-2 { left: 12%;  transform: rotate(-8deg); }
.beam-3 { right: 12%; transform: rotate(8deg); }
.beam-4 { right: -8%; transform: rotate(22deg); }

.outcome-win .beam-1, .outcome-win .beam-3 {
    background: linear-gradient(180deg, rgba(255,215,0,0.10) 0%, rgba(255,180,0,0.03) 40%, transparent 70%);
}
.outcome-win .beam-2, .outcome-win .beam-4 {
    background: linear-gradient(180deg, rgba(255,180,0,0.06) 0%, transparent 55%);
}
.outcome-lose .beam-1, .outcome-lose .beam-2,
.outcome-lose .beam-3, .outcome-lose .beam-4 {
    background: linear-gradient(180deg, rgba(255,60,60,0.07) 0%, transparent 60%);
}
.outcome-draw .beam-1, .outcome-draw .beam-3 {
    background: linear-gradient(180deg, rgba(100,181,246,0.08) 0%, transparent 60%);
}
.outcome-draw .beam-2, .outcome-draw .beam-4 {
    background: linear-gradient(180deg, rgba(21,101,192,0.05) 0%, transparent 55%);
}

/* Ambient glow orb */
.ambient-orb {
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    filter: blur(120px);
    pointer-events: none;
    opacity: 0;
    animation: orbPulse 4s 0.4s ease-in-out infinite alternate;
}
@keyframes orbPulse {
    0%   { opacity: 0.12; transform: translate(-50%,-50%) scale(0.85); }
    100% { opacity: 0.22; transform: translate(-50%,-50%) scale(1.1); }
}
.outcome-win  .ambient-orb { background: radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 65%); }
.outcome-lose .ambient-orb { background: radial-gradient(circle, rgba(255,50,50,0.20) 0%, transparent 65%); }
.outcome-draw .ambient-orb { background: radial-gradient(circle, rgba(100,181,246,0.22) 0%, transparent 65%); }

/* Confetti */
.confetti-piece {
    position: absolute;
    pointer-events: none;
    border-radius: 1px;
}
@keyframes confettiFall {
    0%   { transform: translateY(-60px) rotate(0deg) scale(1); opacity: 1; }
    80%  { opacity: 0.7; }
    100% { transform: translateY(110vh) rotate(800deg) scale(0.5); opacity: 0; }
}

/* ─── MAIN CARD ─── */
.mpwin-card {
    position: relative; z-index: 1;
    background: rgba(6, 14, 32, 0.92);
    border-radius: 24px;
    width: min(500px, 100%);
    max-height: calc(100vh - 24px);
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    opacity: 0;
    transform: scale(0.9);
    animation: cardEntrance 0.3s 0.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes cardEntrance {
    to { opacity: 1; transform: scale(1); }
}
.outcome-win  .mpwin-card {
    border: 1.5px solid rgba(255,215,0,0.30);
    box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
}
.outcome-lose .mpwin-card {
    border: 1.5px solid rgba(255,82,82,0.22);
    box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(255,82,82,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
}
.outcome-draw .mpwin-card {
    border: 1.5px solid rgba(100,181,246,0.22);
    box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(100,181,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
}

/* Accent bar */
.mpwin-accent-bar {
    height: 3px;
    border-radius: 24px 24px 0 0;
}
.outcome-win  .mpwin-accent-bar { background: linear-gradient(90deg, transparent 5%, #FFD700 50%, transparent 95%); }
.outcome-lose .mpwin-accent-bar { background: linear-gradient(90deg, transparent 5%, #FF6B6B 50%, transparent 95%); }
.outcome-draw .mpwin-accent-bar { background: linear-gradient(90deg, transparent 5%, #64B5F6 50%, transparent 95%); }

.mpwin-inner {
    padding: 24px 28px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

/* ─── FULL TIME TAG ─── */
.full-time-tag {
    display: inline-block;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    padding: 2px 18px;
    border-radius: 20px;
    font-family: 'Teko', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 4px;
    color: rgba(255,255,255,0.40);
    text-transform: uppercase;
    opacity: 0;
    animation: fadeIn 0.3s 0.25s ease-out forwards;
    margin-bottom: 6px;
}
@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}

/* ═══════════════════════════════════════════════════
   PROFILE + SCORE SECTION
   ═══════════════════════════════════════════════════ */
.score-profile-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    width: 100%;
    padding: 4px 0 8px;
    opacity: 0;
    transform: scale(0.7);
    animation: scoreProfileReveal 0.4s 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
@keyframes scoreProfileReveal {
    0%   { opacity: 0; transform: scale(0.7); }
    70%  { transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1.0); }
}

/* ─── Player Profile ─── */
.player-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 110px;
    flex-shrink: 0;
}

/* Avatar container with ring */
.avatar-wrap {
    position: relative;
    width: 88px; height: 88px;
}
.avatar-ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    padding: 3px;
}
.avatar-ring::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
}
.avatar-inner {
    width: 100%; height: 100%;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Teko', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    position: relative;
    overflow: hidden;
    z-index: 1;
}

/* Shine sweep overlay on avatar */
.avatar-shine {
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    border-radius: 50%;
    background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(255,255,255,0.20) 45%,
        rgba(255,255,255,0.08) 55%,
        transparent 70%
    );
    pointer-events: none;
    z-index: 2;
}

/* Ring colors per outcome */
/* WIN — local player = gold ring, opp = dark silver */
.outcome-win .profile-me .avatar-ring::before {
    border-color: #FFD700;
    box-shadow: 0 0 14px rgba(255,215,0,0.35), inset 0 0 8px rgba(255,215,0,0.15);
}
.outcome-win .profile-me .avatar-inner {
    background: linear-gradient(135deg, #1a3a6a 0%, #0a1a35 100%);
    box-shadow: 0 0 18px rgba(255,215,0,0.2);
}
.outcome-win .profile-opp .avatar-ring::before {
    border-color: #555;
    box-shadow: 0 0 6px rgba(100,100,100,0.15);
}
.outcome-win .profile-opp .avatar-inner {
    background: linear-gradient(135deg, #2a2a2a 0%, #111 100%);
}

/* LOSE — winner (opp) = gold, loser (me) = red */
.outcome-lose .profile-opp .avatar-ring::before {
    border-color: #FFD700;
    box-shadow: 0 0 14px rgba(255,215,0,0.35), inset 0 0 8px rgba(255,215,0,0.15);
}
.outcome-lose .profile-opp .avatar-inner {
    background: linear-gradient(135deg, #1a3a6a 0%, #0a1a35 100%);
    box-shadow: 0 0 18px rgba(255,215,0,0.2);
}
.outcome-lose .profile-me .avatar-ring::before {
    border-color: #C62828;
    box-shadow: 0 0 8px rgba(198,40,40,0.25);
}
.outcome-lose .profile-me .avatar-inner {
    background: linear-gradient(135deg, #3a1010 0%, #180505 100%);
}

/* TIE — both blue/cyan */
.outcome-draw .avatar-ring::before {
    border-color: #64B5F6;
    box-shadow: 0 0 10px rgba(100,181,246,0.25), inset 0 0 6px rgba(100,181,246,0.12);
}
.outcome-draw .avatar-inner {
    background: linear-gradient(135deg, #0c2d50 0%, #081828 100%);
}

/* Glow breathing for winner avatar */
.avatar-glow-breathe {
    animation: avatarGlowBreathe 2s ease-in-out infinite alternate;
}
@keyframes avatarGlowBreathe {
    0%   { opacity: 0.7; }
    100% { opacity: 1; }
}

/* Winner pulse */
.avatar-winner-pulse {
    animation: avatarWinnerPulse 2s ease-in-out infinite;
}
@keyframes avatarWinnerPulse {
    0%, 100% { transform: scale(1.0); }
    50%      { transform: scale(1.03); }
}

/* Winner shine sweep */
.avatar-shine-sweep .avatar-shine {
    animation: shineSweepAvatar 4s 1.5s ease-in-out infinite;
}
@keyframes shineSweepAvatar {
    0%, 85%  { left: -100%; }
    100%     { left: 200%; }
}

/* Tie shine — slower */
.avatar-shine-tie .avatar-shine {
    animation: shineSweepAvatar 5s 2s ease-in-out infinite;
}

/* Player name */
.profile-name {
    font-family: 'Teko', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: rgba(255,255,255,0.70);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    max-width: 105px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.1;
}
.profile-you-tag {
    font-family: 'Teko', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 1px 10px;
    border-radius: 10px;
    line-height: 1.3;
}
.outcome-win  .profile-you-tag { color: #FFD700; background: rgba(255,215,0,0.10); border: 1px solid rgba(255,215,0,0.15); }
.outcome-lose .profile-you-tag { color: #FF6B6B; background: rgba(255,107,107,0.10); border: 1px solid rgba(255,107,107,0.12); }
.outcome-draw .profile-you-tag { color: #64B5F6; background: rgba(100,181,246,0.10); border: 1px solid rgba(100,181,246,0.12); }

/* ─── SCORE CENTER ─── */
.score-center-block {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    // padding: 0 10px;
    flex-shrink: 0;
}
.score-num {
    font-family: 'Teko', 'Bebas Neue', sans-serif;
    font-size: 125px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    text-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.06);
    min-width: 50px;
    text-align: center;
}
.score-sep {
    font-family: 'Teko', 'Bebas Neue', sans-serif;
    font-size: 60px;
    font-weight: 500;
    color: rgba(255,255,255,0.18);
    padding: 0 2px;
    line-height: 1;
    margin-top: 8px;
    user-select: none;
}

/* ═══════════════════════════════════════════════════
   RESULT TITLE
   ═══════════════════════════════════════════════════ */
.mpwin-title {
    font-family: 'Teko', 'Bebas Neue', sans-serif;
    font-size: 52px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 5px;
    text-transform: uppercase;
    text-align: center;
    position: relative;
    overflow: hidden;
    opacity: 0;
    animation: titleReveal 0.5s 0.65s ease-out forwards;
}
@keyframes titleReveal {
    from { opacity: 0; transform: scale(0.85); filter: blur(5px); }
    to   { opacity: 1; transform: scale(1); filter: blur(0); }
}

/* Title text fill gradients */
.mpwin-title-text {
    position: relative;
    z-index: 1;
}

.outcome-win .mpwin-title-text {
    background: linear-gradient(180deg, #FFF4B0 0%, #FFD700 40%, #FFB300 70%, #B37400 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.5));
}
.outcome-lose .mpwin-title-text {
    background: linear-gradient(180deg, #FFB3B3 0%, #FF5252 40%, #C62828 70%, #8B0000 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.5));
}
.outcome-draw .mpwin-title-text {
    background: linear-gradient(180deg, #E3F2FD 0%, #64B5F6 40%, #1565C0 70%, #0D47A1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.5));
}

/* Title shine sweep overlay */
.title-shine {
    position: absolute;
    top: 0; left: -100%;
    width: 80px; height: 100%;
    background: linear-gradient(
        105deg,
        transparent 0%,
        rgba(255,255,255,0.25) 45%,
        rgba(255,255,255,0.08) 55%,
        transparent 100%
    );
    pointer-events: none;
    z-index: 2;
}
/* Win title shine every 3s */
.outcome-win .title-shine {
    animation: shineSweepTitle 3s 1.5s ease-in-out infinite;
}
/* Tie title shine every 5s */
.outcome-draw .title-shine {
    animation: shineSweepTitle 5s 2.5s ease-in-out infinite;
}
/* Lose — no shine */
.outcome-lose .title-shine {
    display: none;
}
@keyframes shineSweepTitle {
    0%, 75%  { left: -100%; }
    100%     { left: calc(100% + 80px); }
}

/* Title glow */
.outcome-win .mpwin-title::after {
    content: '';
    position: absolute;
    inset: -10px -20px;
    background: radial-gradient(ellipse, rgba(255,215,0,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
}
.outcome-lose .mpwin-title::after {
    content: '';
    position: absolute;
    inset: -10px -20px;
    background: radial-gradient(ellipse, rgba(255,82,82,0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
}

/* ─── SUBTITLE ─── */
.mpwin-subtitle {
    font-family: 'Teko', sans-serif;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 3px;
    color: rgba(255,255,255,0.32);
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 8px;
    opacity: 0;
    animation: subtitleFade 0.3s 0.85s ease-out forwards;
}
@keyframes subtitleFade {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ─── DIVIDER ─── */
.mpwin-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent 100%);
    margin: 2px 0;
}

/* ═══════════════════════════════════════════════════
   PLAYER TABLE
   ═══════════════════════════════════════════════════ */
.mpwin-table-wrap {
    width: 100%;
    opacity: 0;
    animation: tableFadeUp 0.4s 1.0s ease-out forwards;
}
@keyframes tableFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
.mpwin-table {
    width: 100%; border-collapse: collapse;
}
.mpwin-table th {
    font-family: 'Teko', sans-serif;
    font-size: 12px; font-weight: 600;
    letter-spacing: 3px;
    color: rgba(255,255,255,0.22);
    text-transform: uppercase;
    padding: 8px 16px 8px;
}
.mpwin-table th:first-child { text-align: left; padding-left: 18px; }
.mpwin-table th:last-child  { text-align: right; padding-right: 18px; }

.mpwin-table td {
    padding: 12px 16px;
    color: rgba(255,255,255,0.60);
    font-family: 'Teko', sans-serif;
    font-weight: 500;
    font-size: 18px;
    letter-spacing: 1px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: all 0.4s ease;
}
.mpwin-table td:first-child { text-align: left; padding-left: 18px; }
.mpwin-table td:last-child  { text-align: right; padding-right: 18px; }

.mpwin-table tbody tr {
    position: relative;
    overflow: hidden;
}

.player-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}
.table-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
}
.row-me .table-avatar {
    background: linear-gradient(135deg, #0059B3 0%, #00162B 100%);
}
.row-opp .table-avatar {
    background: linear-gradient(135deg, #990000 0%, #170500 100%);
}

.goals-num {
    font-family: 'Teko', 'Bebas Neue', sans-serif;
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
}

/* Row shine overlay */
.row-shine {
    position: absolute;
    top: 0; left: -100%;
    width: 80px; height: 100%;
    background: linear-gradient(
        105deg,
        transparent 0%,
        rgba(255,255,255,0.12) 45%,
        rgba(255,255,255,0.04) 55%,
        transparent 100%
    );
    pointer-events: none;
    z-index: 1;
}
.row-winner .row-shine {
    animation: shineSweepRow 6s 2s ease-in-out infinite;
}
@keyframes shineSweepRow {
    0%, 80%  { left: -100%; }
    100%     { left: calc(100% + 80px); }
}

/* ─── Row highlights per outcome ─── */

/* WIN: winner row (me) = gold highlight */
.outcome-win .row-winner td {
    background: rgba(255,215,0,0.07);
    color: #FFD700;
}
.outcome-win .row-winner td:first-child {
    border-left: 3px solid #FFD700;
    border-radius: 10px 0 0 10px;
    padding-left: 15px;
    box-shadow: inset 8px 0 20px -10px rgba(255,215,0,0.15);
}
.outcome-win .row-winner td:last-child {
    border-radius: 0 10px 10px 0;
}
.outcome-win .row-winner .goals-num {
    color: #FFD700;
    text-shadow: 0 0 15px rgba(255,215,0,0.3);
}

/* LOSE: winner row (opponent) = gold highlight, loser dims */
.outcome-lose .row-winner td {
    background: rgba(255,215,0,0.05);
    color: rgba(255,255,255,0.85);
}
.outcome-lose .row-winner td:first-child {
    border-left: 3px solid #FFD700;
    border-radius: 10px 0 0 10px;
    padding-left: 15px;
    box-shadow: inset 8px 0 20px -10px rgba(255,215,0,0.12);
}
.outcome-lose .row-winner td:last-child {
    border-radius: 0 10px 10px 0;
}
.outcome-lose .row-loser td {
    opacity: 0.40;
}

/* TIE: both rows = blue highlight */
.outcome-draw .mpwin-table tbody td {
    background: rgba(100,181,246,0.04);
    color: rgba(255,255,255,0.75);
}
.outcome-draw .mpwin-table tbody tr td:first-child {
    border-left: 3px solid rgba(100,181,246,0.45);
    padding-left: 15px;
    box-shadow: inset 8px 0 20px -10px rgba(100,181,246,0.12);
}

/* ─── LOBBY HINT ─── */
.mpwin-hint {
    text-align: center;
    font-family: 'Teko', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-top: 6px;
    opacity: 0;
    animation: hintAppear 0.4s 1.25s ease-out forwards;
}
@keyframes hintAppear { to { opacity: 1; } }
.mpwin-hint-inner {
    color: rgba(255,255,255,0.20);
    animation: hintPulse 2.5s 1.5s infinite ease-in-out;
}
@keyframes hintPulse {
    0%, 100% { opacity: 0.20; }
    50%      { opacity: 0.50; }
}

/* ─── RESPONSIVE ─── */
@media (max-height: 560px) {
    .mpwin-inner { padding: 14px 16px 12px; gap: 2px; }
    .mpwin-card { border-radius: 18px; }
    .avatar-wrap { width: 60px; height: 60px; }
    .avatar-inner { font-size: 22px; }
    .avatar-ring::before { border-width: 2px !important; }
    .score-num { font-size: 72px; }
    .score-sep { font-size: 40px; margin-top: 4px; }
    .mpwin-title { font-size: 36px; letter-spacing: 3px; }
    .mpwin-subtitle { font-size: 14px; margin-bottom: 4px; }
    .player-profile { width: 80px; gap: 4px; }
    .profile-name { font-size: 13px; max-width: 75px; }
    .profile-you-tag { font-size: 9px; padding: 0px 8px; }
    .mpwin-table td { padding: 8px 14px; }
    .goals-num { font-size: 24px; }
    .table-avatar { width: 26px; height: 26px; font-size: 11px; }
    .full-time-tag { font-size: 11px; padding: 1px 12px; margin-bottom: 2px; }
    .score-profile-section { padding: 0; }
}
@media (max-height: 440px) {
    .avatar-wrap { width: 44px; height: 44px; }
    .avatar-inner { font-size: 17px; }
    .score-num { font-size: 56px; }
    .score-sep { font-size: 30px; }
    .mpwin-title { font-size: 28px; letter-spacing: 2px; }
    .mpwin-subtitle { font-size: 12px; }
    .player-profile { width: 65px; gap: 2px; }
    .profile-name { font-size: 11px; max-width: 60px; }
    .profile-you-tag { display: none; }
    .score-center-block { padding: 0 4px; }
    .table-avatar { width: 22px; height: 22px; font-size: 10px; }
}

/* Avatar images inside ring containers */
.avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    background: linear-gradient(135deg, #1a2a4a 0%, #0a1628 100%);
}

.table-avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    background: linear-gradient(135deg, #1a2a4a 0%, #0a1628 100%);
}

@media (max-height: 560px) {
    .avatar-img, .table-avatar-img {
        image-rendering: auto;
    }
}
        `;
        document.head.appendChild(style);
    }

    function _injectNewStyles() {
        if (document.getElementById('mpwin-styles-new')) return;
        var style = document.createElement('style');
        style.id = 'mpwin-styles-new';
        style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Teko:wght@400;500;600;700&display=swap');

/* ─── OVERLAY ─── */
#mpwin-overlay {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    font-family: 'Outfit', sans-serif;
    overflow: hidden;
    padding: 12px;
    box-sizing: border-box;
}

/* ─── BACKGROUND ─── */
.mpwin-bg {
    position: absolute; inset: 0;
    overflow: hidden;
}
.outcome-win  .mpwin-bg { background: radial-gradient(ellipse at 50% 30%, #1a2f4a 0%, #0a1628 50%, #050a14 100%); }
.outcome-lose .mpwin-bg { background: radial-gradient(ellipse at 50% 30%, #2a0e14 0%, #0f0a18 50%, #050a14 100%); }
.outcome-draw .mpwin-bg { background: radial-gradient(ellipse at 50% 30%, #0c2240 0%, #081228 50%, #050a14 100%); }

.mpwin-bg::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%);
    pointer-events: none;
}

/* Beams & Orb */
.stadium-beam {
    position: absolute;
    top: -30%;
    width: 350px;
    height: 1000px;
    transform-origin: top center;
    pointer-events: none;
    opacity: 0;
    animation: beamFadeIn 1.5s 0.2s ease-out forwards;
}
@keyframes beamFadeIn { to { opacity: 1; } }
.beam-1 { left: -8%;  transform: rotate(-22deg); }
.beam-2 { left: 12%;  transform: rotate(-8deg); }
.beam-3 { right: 12%; transform: rotate(8deg); }
.beam-4 { right: -8%; transform: rotate(22deg); }

.outcome-win .beam-1, .outcome-win .beam-3 {
    background: linear-gradient(180deg, rgba(0,198,255,0.08) 0%, rgba(0,198,255,0.02) 40%, transparent 70%);
}
.outcome-win .beam-2, .outcome-win .beam-4 {
    background: linear-gradient(180deg, rgba(0,198,255,0.04) 0%, transparent 55%);
}
.outcome-lose .beam-1, .outcome-lose .beam-2,
.outcome-lose .beam-3, .outcome-lose .beam-4 {
    background: linear-gradient(180deg, rgba(255,59,48,0.07) 0%, transparent 60%);
}
.outcome-draw .beam-1, .outcome-draw .beam-3 {
    background: linear-gradient(180deg, rgba(100,181,246,0.08) 0%, transparent 60%);
}
.outcome-draw .beam-2, .outcome-draw .beam-4 {
    background: linear-gradient(180deg, rgba(21,101,192,0.05) 0%, transparent 55%);
}

.ambient-orb {
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    filter: blur(120px);
    pointer-events: none;
    opacity: 0;
    animation: orbPulse 4s 0.4s ease-in-out infinite alternate;
}
@keyframes orbPulse {
    0%   { opacity: 0.12; transform: translate(-50%,-50%) scale(0.85); }
    100% { opacity: 0.22; transform: translate(-50%,-50%) scale(1.1); }
}
.outcome-win  .ambient-orb { background: radial-gradient(circle, rgba(0,198,255,0.25) 0%, transparent 65%); }
.outcome-lose .ambient-orb { background: radial-gradient(circle, rgba(255,59,48,0.18) 0%, transparent 65%); }
.outcome-draw .ambient-orb { background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%); }

.confetti-piece {
    position: absolute;
    pointer-events: none;
    border-radius: 1px;
}
@keyframes confettiFall {
    0%   { transform: translateY(-60px) rotate(0deg) scale(1); opacity: 1; }
    80%  { opacity: 0.7; }
    100% { transform: translateY(110vh) rotate(800deg) scale(0.5); opacity: 0; }
}

/* ─── MAIN CARD ─── */
.mpwin-card {
    position: relative; z-index: 1;
    background: rgba(6, 14, 32, 0.78);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border-radius: 28px;
    border: 2px solid transparent;
    background-image: linear-gradient(rgba(6, 14, 32, 0.88), rgba(6, 14, 32, 0.88)),
                      linear-gradient(90deg, #FF3B30 0%, #FF3B30 45%, #00C6FF 55%, #00C6FF 100%);
    background-origin: border-box;
    background-clip: padding-box, border-box;
    box-shadow: 
        0 30px 80px rgba(0,0,0,0.8),
        -20px 0 60px rgba(255, 59, 48, 0.1),
        20px 0 60px rgba(0, 198, 255, 0.1);
    opacity: 0;
    transform: scale(0.9);
    animation: cardEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    max-width: 580px;
    max-height: min(390px, 94vh);
    overflow: hidden;
    margin: auto;
}
@keyframes cardEntrance {
    to { opacity: 1; transform: scale(1); }
}

.mpwin-inner {
    padding: 24px 28px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
}

.mpwin-game-title {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 16px;
    margin-bottom: -4px;
    animation: gameTitleEntrance 0.5s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.game-title-text {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(10px, 1.8vmin, 13px);
    font-weight: 700;
    letter-spacing: 4px;
    color: rgba(255, 255, 255, 0.85);
    text-transform: uppercase;
}
.game-title-line {
    height: 1.5px;
    width: clamp(30px, 8vw, 60px);
    display: inline-block;
}
.game-title-line-left {
    background: linear-gradient(90deg, transparent, #FF3B30);
}
.game-title-line-right {
    background: linear-gradient(270deg, transparent, #00C6FF);
}
@keyframes gameTitleEntrance {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ─── HEADER TITLE & SCORE ─── */
.score-profile-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
    margin-top: 16px;
    padding-bottom: 28px;
}
 
.player-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: clamp(130px, 26vmin, 180px);
    gap: 0;
    text-align: center;
    position: relative;
}
 
.avatar-wrap {
    position: relative;
    width: clamp(110px, 18vmin, 135px);
    height: clamp(146px, 24vmin, 180px);
    border-radius: 14px;
}
.avatar-inner {
    width: 100%; height: 100%;
    border-radius: 14px;
    overflow: hidden;
    box-sizing: border-box;
    background: linear-gradient(135deg, #101525, #050a15);
    display: flex; align-items: center; justify-content: center;
}
.avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 14px;
    object-fit: contain;
    object-position: bottom center;
    display: block;
}
 
.profile-me .avatar-inner {
    border: 4px solid #FF3B30;
    box-shadow: 0 0 20px rgba(255, 59, 48, 0.8), inset 0 0 10px rgba(255, 59, 48, 0.4);
}
.profile-opp .avatar-inner {
    border: 4px solid #00C6FF;
    box-shadow: 0 0 20px rgba(0, 198, 255, 0.8), inset 0 0 10px rgba(0, 198, 255, 0.4);
}
 
.profile-name {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(13px, 2.4vmin, 17px);
    font-weight: 800;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    background: transparent;
    border: none;
    padding: 0 0 6px 0;
    border-radius: 0;
    display: inline-block;
    box-sizing: border-box;
    text-align: center;
    white-space: nowrap;
    overflow: visible;
    box-shadow: none;
    transition: all 0.3s ease;
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
}
.profile-me .profile-name {
    border-bottom: 2px solid #FF3B30;
    text-shadow: 0 0 8px rgba(255, 59, 48, 0.4);
}
.profile-opp .profile-name {
    border-bottom: 2px solid #00C6FF;
    text-shadow: 0 0 8px rgba(0, 198, 255, 0.4);
}

/* Attempts dots layout */
.attempts {
    display: flex;
    gap: 5px;
    justify-content: center;
    margin-top: 2px;
}
.attempts span {
    width: clamp(10px, 2vmin, 13px);
    height: clamp(10px, 2vmin, 13px);
    border-radius: 50%;
    box-sizing: border-box;
    display: inline-block;
    flex-shrink: 0;
}
.dot-goal {
    background: #00E676;
    box-shadow: 0 0 6px rgba(0, 230, 118, 0.7);
}
.dot-miss {
    background: #FF3B30;
    box-shadow: 0 0 6px rgba(255, 59, 48, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
}
.dot-x-symbol {
    color: #FFFFFF;
    font-family: Arial, sans-serif;
    font-size: clamp(6px, 1.2vmin, 8px);
    font-weight: 900;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    transform: scale(0.9);
}
.dot-pending {
    background: rgba(255, 255, 255, 0.1);
    border: 1.2px solid rgba(255, 255, 255, 0.2);
}

/* Score Block */
.score-center-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
}
.center-header-text {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(9px, 1.8vmin, 11px);
    font-weight: 700;
    letter-spacing: 4px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    margin-bottom: 8px;
}
.center-score-row {
    display: flex;
    align-items: center;
    gap: clamp(8px, 2.5vmin, 16px);
}
.center-score-num {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(80px, 16vmin, 110px);
    font-weight: 800;
    color: #ffffff;
    line-height: 0.8;
}
.center-score-sep {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(48px, 9.6vmin, 66px);
    font-weight: 800;
    color: rgba(255, 255, 255, 0.8);
    line-height: 0.8;
    margin-top: -6px;
}

/* ─── RESULT TITLE ─── */
.mpwin-title {
    font-family: 'Teko', sans-serif;
    font-size: clamp(36px, 7vmin, 52px);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-align: center;
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    line-height: 1;
    width: 100%;
}
.mpwin-title-text {
    color: #ffffff;
}

.outcome-win .mpwin-title-text {
    color: #00C6FF;
    text-shadow: 0 0 16px rgba(0, 198, 255, 0.8), 0 0 32px rgba(0, 198, 255, 0.4);
}
.outcome-lose .mpwin-title-text {
    color: #FF3B30;
    text-shadow: 0 0 16px rgba(255, 59, 48, 0.8), 0 0 32px rgba(255, 59, 48, 0.4);
}
.outcome-draw .mpwin-title-text {
    color: #E0E0E0;
    text-shadow: 0 0 16px rgba(224, 224, 224, 0.5);
}

.mpwin-title-chevron {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(24px, 5vmin, 36px);
    font-weight: 900;
    vertical-align: middle;
    display: inline-block;
    line-height: 1;
    margin-top: -6px;
}
.chevron-left {
    margin-right: clamp(10px, 3vw, 18px);
}
.chevron-right {
    margin-left: clamp(10px, 3vw, 18px);
}

.outcome-win .mpwin-title-chevron {
    color: #00C6FF;
    text-shadow: 0 0 16px rgba(0, 198, 255, 0.8), 0 0 32px rgba(0, 198, 255, 0.4);
}
.outcome-lose .mpwin-title-chevron {
    color: #FF3B30;
    text-shadow: 0 0 16px rgba(255, 59, 48, 0.8), 0 0 32px rgba(255, 59, 48, 0.4);
}
.outcome-draw .mpwin-title-chevron {
    color: #E0E0E0;
    text-shadow: 0 0 16px rgba(224, 224, 224, 0.5);
}

.outcome-divider {
    position: relative;
    width: 80%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.15) 70%, transparent 100%);
    margin: 8px auto 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.outcome-divider::after {
    content: '';
    position: absolute;
    width: 60px;
    height: 3px;
    border-radius: 50%;
    filter: blur(2.5px);
}
.outcome-win .outcome-divider::after {
    background: #00C6FF;
    box-shadow: 0 0 12px rgba(0, 198, 255, 0.9);
}
.outcome-lose .outcome-divider::after {
    background: #FF3B30;
    box-shadow: 0 0 12px rgba(255, 59, 48, 0.9);
}
.outcome-draw .outcome-divider::after {
    background: #E0E0E0;
    box-shadow: 0 0 12px rgba(224, 224, 224, 0.6);
}

/* Stats removed */

/* ─── SEPARATOR ─── */
.mpwin-card-separator {
    position: relative;
    width: 100%;
    height: 24px;
    margin: 4px 0 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.mpwin-separator-ball {
    font-size: 20px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(0, 198, 255, 0.4);
    animation: ballGlowPulse 2s infinite ease-in-out alternate;
}
@keyframes ballGlowPulse {
    0% {
        transform: scale(1.0);
        text-shadow: 0 0 15px rgba(255, 255, 255, 0.6), 0 0 25px rgba(0, 198, 255, 0.3);
    }
    100% {
        transform: scale(1.1);
        text-shadow: 0 0 22px rgba(255, 255, 255, 0.9), 0 0 40px rgba(0, 198, 255, 0.6);
    }
}

/* ─── ACTION BUTTONS ─── */
.mpwin-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(12px, 4vw, 24px);
    width: 100%;
    margin-top: 4px;
}

.btn-play-again {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-family: 'Outfit', sans-serif;
    font-size: clamp(11px, 2vmin, 13px);
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: clamp(10px, 2vmin, 14px) clamp(16px, 3.5vw, 28px);
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
}
.btn-play-again:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.20);
    transform: translateY(-1.5px);
}
.btn-play-again:active {
    transform: translateY(0.5px);
}

.btn-exit {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid #FF3B30;
    box-shadow: 0 0 10px rgba(255, 59, 48, 0.2);
    color: #ffffff;
    font-family: 'Outfit', sans-serif;
    font-size: clamp(11px, 2vmin, 13px);
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: clamp(10px, 2vmin, 14px) clamp(20px, 4vw, 36px);
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
}
.btn-exit:hover {
    background: rgba(255, 59, 48, 0.06);
    box-shadow: 0 0 16px rgba(255, 59, 48, 0.4);
    transform: translateY(-1.5px);
}
.btn-exit:active {
    transform: translateY(0.5px);
}

/* ─── RESPONSIVE MOBILE ─── */
@media (max-width: 480px) {
    .mpwin-card {
        padding: 16px;
        max-height: calc(100vh - 16px);
    }
    .mpwin-inner {
        padding: 12px;
        gap: 12px;
    }
}

@media (max-height: 480px) {
    .mpwin-card {
        max-width: 480px;
        max-height: calc(100vh - 16px);
    }
    .mpwin-inner {
        padding: 12px 16px 8px;
        gap: 6px;
    }
    .score-profile-section {
        margin-top: 8px;
        padding-bottom: 20px;
    }
    .avatar-wrap {
        width: clamp(75px, 15vmin, 95px);
        height: clamp(100px, 20vmin, 126px);
        border-radius: 10px;
    }
    .profile-name {
        font-size: clamp(10px, 2vmin, 13px);
        bottom: -20px;
    }
    .center-score-num {
        font-size: clamp(45px, 10vmin, 60px);
    }
    .center-score-sep {
        font-size: clamp(28px, 6vmin, 38px);
    }
    .mpwin-title {
        font-size: clamp(20px, 5vmin, 30px);
        margin: 2px 0;
    }
    .mpwin-card-separator {
        height: 16px;
        margin: 2px 0 0 0;
    }
    .mpwin-separator-ball {
        font-size: 15px;
    }
}
        `;
        document.head.appendChild(style);
    }

    this._init = function () { _injectNewStyles(); };

    // ── Show ──────────────────────────────────────────────────────────────────
    this.show = function (oResult) {
        var result = oResult.result || 'draw';
        var players = oResult.players || [];
        var myShots = oResult.myShots || [];
        var oppShots = oResult.oppShots || [];

        // Parse data
        var myGoals = 0, oppGoals = 0;
        var myName = oResult.myName || 'You', oppName = 'Opponent';

        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            if (p.isMe) {
                myGoals = p.goals !== undefined ? p.goals : 0;
                myName = p.name || myName;
            } else {
                oppGoals = p.goals !== undefined ? p.goals : 0;
                oppName = p.name || oppName;
            }
        }

        // Get avatar paths from CAvatarManager
        var myAvatarPath = (typeof CAvatarManager !== 'undefined') ? CAvatarManager.getMyAvatarPath() : 'sprites/Avatars/default.png';
        var oppAvatarPath = (typeof CAvatarManager !== 'undefined') ? CAvatarManager.getOppAvatarPath() : 'sprites/Avatars/default.png';

        var szTitle;
        if (result === 'win') {
            szTitle = 'YOU WIN';
        } else if (result === 'lose') {
            szTitle = 'YOU LOSE';
        } else {
            szTitle = 'MATCH TIED';
        }

        // No stats calculations needed

        function renderWinPanelDots(shots, max) {
            var html = '<div class="attempts">';
            for (var i = 0; i < max; i++) {
                var cls = '';
                if (i < shots.length) {
                    cls = shots[i] === 'goal' ? 'dot-goal' : 'dot-miss';
                } else {
                    cls = 'dot-pending';
                }
                
                if (cls === 'dot-goal') {
                    html += '<span class="' + cls + '"></span>';
                } else if (cls === 'dot-miss') {
                    html += '<span class="' + cls + '"><span class="dot-x-symbol">✕</span></span>';
                } else {
                    html += '<span class="' + cls + '"></span>';
                }
            }
            html += '</div>';
            return html;
        }

        _el = document.createElement('div');
        _el.id = 'mpwin-overlay';
        _el.className = 'outcome-' + result;
        _el.innerHTML =
            '<div class="mpwin-bg">' +
                '<div class="stadium-beam beam-1"></div>' +
                '<div class="stadium-beam beam-2"></div>' +
                '<div class="stadium-beam beam-3"></div>' +
                '<div class="stadium-beam beam-4"></div>' +
                '<div class="ambient-orb"></div>' +
                '<div id="confetti-box"></div>' +
            '</div>' +

            '<div class="mpwin-card">' +
                '<div class="mpwin-inner">' +

                    /* Game Title at Top */
                    '<div class="mpwin-game-title">' +
                        '<span class="game-title-line game-title-line-left"></span>' +
                        '<span class="game-title-text">PENALTY KICK</span>' +
                        '<span class="game-title-line game-title-line-right"></span>' +
                    '</div>' +

                    /* Profile + Score Section */
                    '<div class="score-profile-section">' +

                        /* Left — local player (Blue) */
                        '<div class="player-profile profile-me">' +
                            '<div class="avatar-wrap">' +
                                '<div class="avatar-inner">' +
                                    '<img src="' + myAvatarPath + '" class="avatar-img" onerror="this.onerror=null;this.src=\'sprites/Avatars/default.png\';" draggable="false" alt="Avatar">' +
                                '</div>' +
                            '</div>' +
                            '<div class="profile-name">' + myName + '</div>' +
                        '</div>' +

                        /* Center — score info */
                        '<div class="score-center-block">' +
                            '<div class="center-score-row">' +
                                '<span class="center-score-num">' + myGoals + '</span>' +
                                '<span class="center-score-sep">-</span>' +
                                '<span class="center-score-num">' + oppGoals + '</span>' +
                            '</div>' +
                        '</div>' +

                        /* Right — opponent (Red) */
                        '<div class="player-profile profile-opp">' +
                            '<div class="avatar-wrap">' +
                                '<div class="avatar-inner">' +
                                    '<img src="' + oppAvatarPath + '" class="avatar-img" onerror="this.onerror=null;this.src=\'sprites/Avatars/default.png\';" draggable="false" alt="Avatar">' +
                                '</div>' +
                            '</div>' +
                            '<div class="profile-name">' + oppName + '</div>' +
                        '</div>' +

                    '</div>' +

                    /* Horizontal Divider with center glow above Title */
                    '<div class="outcome-divider"></div>' +

                    /* Result Title */
                    '<div class="mpwin-title">' +
                        '<span class="mpwin-title-chevron chevron-left">&gt;</span>' +
                        '<span class="mpwin-title-text">' + szTitle + '</span>' +
                        '<span class="mpwin-title-chevron chevron-right">&lt;</span>' +
                    '</div>' +

                    /* Separator with Soccer Ball */
                    '<div class="mpwin-card-separator">' +
                        '<div class="mpwin-separator-ball">⚽</div>' +
                    '</div>' +

                    '' +

                '</div>' +
            '</div>';

        document.body.appendChild(_el);

        // Victory confetti
        if (result === 'win') {
            var box = document.getElementById('confetti-box');
            if (box) {
                var colors = ['#FFD700','#FFA500','#FFF3A8','#FF8C00','#FFFFFF','#FFE082'];
                for (var c = 0; c < 70; c++) {
                    var p = document.createElement('div');
                    p.className = 'confetti-piece';
                    p.style.left = Math.random() * 100 + '%';
                    p.style.top = -(10 + Math.random() * 30) + 'px';
                    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    var w = 4 + Math.random() * 6;
                    p.style.width = w + 'px';
                    p.style.height = (w * (1.5 + Math.random())) + 'px';
                    p.style.animation = 'confettiFall ' + (3 + Math.random() * 3.5) + 's linear infinite';
                    p.style.animationDelay = (Math.random() * 3) + 's';
                    box.appendChild(p);
                }
            }
        }
    };

    this.unload = function () {
        if (_el && _el.parentNode) {
            document.body.removeChild(_el);
            _el = null;
        }
    };

    this._init();
    return this;
}
