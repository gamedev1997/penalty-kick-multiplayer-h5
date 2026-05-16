function CInterface() {
    var _pStartPosAudio;
    var _pStartPosGuiBox;

    var _oAudioToggle;
    var _oWinPanel = null;
    var _oPause;
    var _oHelpText;

    var _iStep;

    // ── Anim-text queue: prevents overlapping Goal / Saved / Out texts ──
    var _bTextAnimating = false;
    var _aTextQueue     = [];

    this._init = function (bHideInitially) {
        _pStartPosGuiBox = {x: 0, y: 0};

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _pStartPosAudio = {x: CANVAS_WIDTH - (oSprite.height / 2) - 10, y: (oSprite.height / 2) + 10};
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
        }

        _oHelpText = new CHelpText(s_oStage);
        if (!bHideInitially) {
            _oHelpText.fadeAnim(1, null);
        }

        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    };

    this.showHelpText = function (bVisible) {
        if (!_oHelpText) return;
        if (bVisible && s_oGame && typeof s_oGame.isMultiplayer === 'function' && s_oGame.isMultiplayer()
                && typeof s_oGame.isMyTurn === 'function' && !s_oGame.isMyTurn()) {
            bVisible = false;
        }
        _oHelpText.setVisible(bVisible);
        console.log("showHelpText: " + bVisible);
    };

    this.fadeOutHelpText = function () {
        if (!_oHelpText) return;
        _oHelpText.fadeAnim(0, function () {
            _oHelpText.setVisible(false);
        });
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.setPosition(_pStartPosAudio.x - iNewX, iNewY + _pStartPosAudio.y);
        }
    };

    this.unloadHelpText = function () {
        if (_oHelpText !== null) {
            _oHelpText.fadeAnim(0, _oHelpText.unload);
            _oHelpText = null;
        }
    };

    this.unload = function () {
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }

        s_oInterface = null;
    };

    this.createWinPanel = function (iScore) {
        _oWinPanel = new CWinPanel(s_oSpriteLibrary.getSprite("msg_box"));
        _oWinPanel.show(iScore);
    };

    // Multiplayer-specific end screen with ranked leaderboard
    // oResult = { result: 'win'|'lose'|'draw', players: [{rank, name, goals}] }
    this.createMpWinPanel = function (oResult) {
        _oWinPanel = new CMpWinPanel();
        _oWinPanel.show(oResult);
    };


    this.refreshTextScoreBoard = function (iScore, fMultiplier, iScoreNoMult, bEffect) {
        // score board removed
    };

    this.refreshMultiplayerScore = function (iMyGoals, iOppGoals, szMyName, szOppName) {
        // score board removed
    };
    
    this.refreshLaunchBoard = function (iLaunch, iMaxLaunch) {
        // launch board removed
    };

    // Public: queue a result text (GOAL!, SAVED, OUT). Only one plays at a time.
    this.createAnimText = function (szText, iSize, bStrobo, szColor, szColorStroke) {
        // Ignore duplicate of the same text that is already animating or at front of queue
        if (_aTextQueue.length > 0 && _aTextQueue[_aTextQueue.length - 1].szText === szText) {
            return;
        }
        _aTextQueue.push({ szText: szText, iSize: iSize, bStrobo: bStrobo, szColor: szColor, szColorStroke: szColorStroke });
        if (!_bTextAnimating) {
            this._playNextAnimText();
        }
    };

    // Public: call this on resetScene() so stale queued texts don't bleed into next round
    this.clearAnimTextQueue = function () {
        _aTextQueue     = [];
        _bTextAnimating = false;
    };

    // Internal: dequeue and animate the next text in the queue
    this._playNextAnimText = function () {
        if (_aTextQueue.length === 0) {
            _bTextAnimating = false;
            return;
        }
        _bTextAnimating = true;
        var oData = _aTextQueue.shift();
        var szText = oData.szText, iSize = oData.iSize, bStrobo = oData.bStrobo;
        var szColor = oData.szColor, szColorStroke = oData.szColorStroke;

        var oContainer = new createjs.Container();

        var oTextStroke = new createjs.Text(szText, iSize + "px " + FONT_GAME, szColorStroke);
        oTextStroke.x = 0;
        oTextStroke.y = 0;
        oTextStroke.textAlign = "center";
        oTextStroke.outline = 4;
        oContainer.addChild(oTextStroke);

        var oText = new createjs.Text(szText, iSize + "px " + FONT_GAME, szColor);
        oText.x = 0;
        oText.y = 0;
        oText.textAlign = "center";
        oContainer.addChild(oText);

        oContainer.x = CANVAS_WIDTH_HALF;
        oContainer.y = -oTextStroke.getBounds().height;

        if (bStrobo) {
            s_oInterface.strobeText(oText);
        }

        s_oStage.addChild(oContainer);

        var self = s_oInterface;
        createjs.Tween.get(oContainer).to({y: CANVAS_HEIGHT_HALF}, 500, createjs.Ease.cubicOut).call(function () {
            createjs.Tween.get(oContainer).wait(300).to({y: CANVAS_HEIGHT + oTextStroke.getBounds().height}, 500, createjs.Ease.cubicIn).call(function () {
                if (bStrobo) {
                    createjs.Tween.removeTweens(oText);
                }
                s_oStage.removeChild(oContainer);
                // Play next in queue after current finishes
                if (self) { self._playNextAnimText(); }
            });
        });
    };


    this.strobeText = function (oText) {
        createjs.Tween.get(oText).wait(30).call(function () {
            if (_iStep < TEXT_EXCELLENT_COLOR.length - 1) {
                _iStep++;
            } else {
                _iStep = 0;
            }
            oText.color = TEXT_EXCELLENT_COLOR[_iStep];
            s_oInterface.strobeText(oText);
        });
    };


    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };

    this.unloadPause = function () {
        if (_oPause) {
            _oPause.unload();
            _oPause = null;
        }
    };

    s_oInterface = this;

    this._init();

    return this;
}

var s_oInterface = null;