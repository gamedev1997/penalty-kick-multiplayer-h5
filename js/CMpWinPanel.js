// ─── CMpWinPanel.js ───────────────────────────────────────────────────────────
// Multiplayer game-over screen: shows YOU WIN / YOU LOSE / DRAW result plus a
// ranked leaderboard (Rank | Name | Goals) drawn entirely with CreateJS.
// Called by CInterface.createMpWinPanel({ result, players }).
// ─────────────────────────────────────────────────────────────────────────────

function CMpWinPanel() {

    var _oGroup = null;

    // ── colours & sizes ──────────────────────────────────────────────────────
    var C = {
        OVERLAY   : 'rgba(0,0,0,0.72)',
        PANEL_FILL: '#0d1b2a',
        PANEL_LINE: '#1e3a5f',
        WIN_COLOR : '#FFD700',
        LOSE_COLOR: '#ff4444',
        DRAW_COLOR: '#aaddff',
        WHITE     : '#ffffff',
        GOLD      : '#FFD700',
        SILVER    : '#C0C0C0',
        ROW_ODD   : 'rgba(255,255,255,0.06)',
        ROW_EVEN  : 'rgba(255,255,255,0.02)',
        RANK1_BG  : 'rgba(255,215,0,0.18)',
        HEADER_BG : 'rgba(255,255,255,0.10)',
        FONT      : FONT_GAME
    };

    var PANEL_W = 680;
    var PANEL_H = 380;
    var PANEL_X = CANVAS_WIDTH_HALF  - PANEL_W * 0.5;
    var PANEL_Y = CANVAS_HEIGHT_HALF - PANEL_H * 0.5;
    var RADIUS  = 18;

    // ── helpers ───────────────────────────────────────────────────────────────
    function _roundRect(g, x, y, w, h, r) {
        g.moveTo(x + r, y)
         .lineTo(x + w - r, y)
         .arcTo(x + w, y, x + w, y + r, r)
         .lineTo(x + w, y + h - r)
         .arcTo(x + w, y + h, x + w - r, y + h, r)
         .lineTo(x + r, y + h)
         .arcTo(x, y + h, x, y + h - r, r)
         .lineTo(x, y + r)
         .arcTo(x, y, x + r, y, r)
         .closePath();
    }

    function _text(parent, szText, iSize, szColor, iX, iY, szAlign, bOutline) {
        if (bOutline) {
            var stroke = new createjs.Text(szText, iSize + 'px ' + C.FONT, '#000000');
            stroke.textAlign = szAlign || 'center';
            stroke.x = iX; stroke.y = iY;
            stroke.outline = 5;
            parent.addChild(stroke);
        }
        var t = new createjs.Text(szText, iSize + 'px ' + C.FONT, szColor);
        t.textAlign = szAlign || 'center';
        t.x = iX; t.y = iY;
        parent.addChild(t);
        return t;
    }

    // ── init ──────────────────────────────────────────────────────────────────
    this._init = function () {
        _oGroup         = new createjs.Container();
        _oGroup.alpha   = 0;
        _oGroup.visible = false;

        // Dark overlay
        var oOverlay = new createjs.Shape();
        oOverlay.graphics.beginFill(C.OVERLAY).drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oGroup.addChild(oOverlay);

        // Panel background (rounded rect + border)
        var oPanelBg = new createjs.Shape();
        var g = oPanelBg.graphics;
        g.beginFill(C.PANEL_FILL);
        _roundRect(g, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, RADIUS);
        g.endFill();
        g.setStrokeStyle(2).beginStroke(C.PANEL_LINE);
        _roundRect(g, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, RADIUS);
        g.endStroke();
        _oGroup.addChild(oPanelBg);

        // Block clicks on overlay
        _oGroup.on('click', function () {});

        s_oStage.addChild(_oGroup);
    };

    // ── show ──────────────────────────────────────────────────────────────────
    // oResult = { result:'win'|'lose'|'draw', myName:'...', players:[{rank,name,goals,isMe}] }
    this.show = function (oResult) {
        var result  = oResult.result  || 'draw';
        var myName  = oResult.myName  || '';
        var players = oResult.players || [];

        var cx = CANVAS_WIDTH_HALF;

        // ── Result banner ────────────────────────────────────────────────────
        var szResultText, szResultColor, szSubText;
        if (result === 'win') {
            szResultText  = 'You Win';
            szResultColor = C.WIN_COLOR;
            szSubText     = 'Congratulations!';
        } else if (result === 'lose') {
            szResultText  = 'You Lose';
            szResultColor = C.LOSE_COLOR;
            szSubText     = 'Better luck next time!';
        } else {
            szResultText  = 'Match Tie';
            szResultColor = C.DRAW_COLOR;
            szSubText     = 'What a match!';
        }

        // Large result headline
        _text(_oGroup, szResultText, 56, szResultColor, cx, PANEL_Y + 28, 'center', true);

        // Sub-text
        _text(_oGroup, szSubText, 22, 'rgba(255,255,255,0.65)', cx, PANEL_Y + 90, 'center', false);

        // ── Leaderboard ───────────────────────────────────────────────────────
        var tblX  = PANEL_X + 40;
        var tblW  = PANEL_W - 80;
        var tblY  = PANEL_Y + 118;
        var ROW_H = 48;

        // Column layout: [rankW, nameW, goalsW]
        var colW   = [80, tblW - 160, 80];
        var colX   = [tblX, tblX + colW[0], tblX + colW[0] + colW[1]];

        // Header row background
        var oHeaderBg = new createjs.Shape();
        oHeaderBg.graphics.beginFill(C.HEADER_BG)
            .drawRect(tblX, tblY, tblW, ROW_H);
        _oGroup.addChild(oHeaderBg);

        // Header labels
        var headers = ['RANK', 'NAME', 'GOALS'];
        for (var h = 0; h < headers.length; h++) {
            var hCx = colX[h] + colW[h] * 0.5;
            _text(_oGroup, headers[h], 20, 'rgba(255,255,255,0.55)', hCx, tblY + 13, 'center', false);
        }

        // Thin header bottom line
        var oHLine = new createjs.Shape();
        oHLine.graphics.setStrokeStyle(1).beginStroke('rgba(255,255,255,0.15)')
              .moveTo(tblX, tblY + ROW_H).lineTo(tblX + tblW, tblY + ROW_H);
        _oGroup.addChild(oHLine);

        // Data rows
        for (var r = 0; r < players.length; r++) {
            var p     = players[r];
            var ry    = tblY + ROW_H + r * ROW_H;
            var isP1  = (p.rank === 1);       // rank-1 drives medal / rank colour
            var isMe  = (p.isMe === true);    // isMe drives the personal highlight

            // Row background: gold tint for MY own row, subtle alt for others
            var oRowBg = new createjs.Shape();
            oRowBg.graphics
                  .beginFill(isMe ? C.RANK1_BG : (r % 2 === 0 ? C.ROW_ODD : C.ROW_EVEN))
                  .drawRect(tblX, ry, tblW, ROW_H);
            _oGroup.addChild(oRowBg);

            // Rank medal (gold for #1, silver for #2 — based on rank, not isMe)
            var rankColor = isP1 ? C.GOLD : C.SILVER;
            var rankLabel = isP1 ? '🥇 #1' : '🥈 #2';
            _text(_oGroup, rankLabel, 22, rankColor, colX[0] + colW[0] * 0.5, ry + 13, 'center', false);

            // Name: bright gold + outline for MY row, dimmer white for opponent
            var nameColor = isMe ? C.GOLD : 'rgba(255,255,255,0.70)';
            _text(_oGroup, p.name, 24, nameColor, colX[1] + colW[1] * 0.5, ry + 12, 'center', isMe);

            // Goals
            _text(_oGroup, String(p.goals), 26, nameColor, colX[2] + colW[2] * 0.5, ry + 12, 'center', isMe);

            // Row bottom separator
            var oLine = new createjs.Shape();
            oLine.graphics.setStrokeStyle(1).beginStroke('rgba(255,255,255,0.08)')
                 .moveTo(tblX, ry + ROW_H).lineTo(tblX + tblW, ry + ROW_H);
            _oGroup.addChild(oLine);
        }

        // ── Animate in ────────────────────────────────────────────────────────
        _oGroup.visible = true;
        createjs.Tween.get(_oGroup).to({alpha: 1}, 600, createjs.Ease.cubicOut);
    };

    this.unload = function () {
        _oGroup.removeAllEventListeners();
        s_oStage.removeChild(_oGroup);
    };

    this._init();
    return this;
}
