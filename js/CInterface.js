function CInterface() {
    var _pStartPosAudio;
    var _pStartPosGuiBox;

    var _oAudioToggle;
    var _oWinPanel = null;
    var _oPause;
    var _oHelpText;

    var _iStep;

    this._init = function () {
        _pStartPosGuiBox = {x: 0, y: 0};

        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            _pStartPosAudio = {x: CANVAS_WIDTH - (oSprite.height / 2) - 10, y: (oSprite.height / 2) + 10};
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
        }

        _oHelpText = new CHelpText(s_oStage);
        _oHelpText.fadeAnim(1, null);

        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
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

    this.createAnimText = function (szText, iSize, bStrobo, szColor, szColorStroke) {//TEXT_BALL_OUT, 90, false, TEXT_COLOR_1, TEXT_COLOR_STROKE
        var oContainer = new createjs.Container();

        var oTextStroke = new createjs.Text(szText, iSize + "px " + FONT_GAME, szColorStroke);
        oTextStroke.x = 0;
        oTextStroke.y = 0;
        oTextStroke.textAlign = "center";
        oTextStroke.outline = 4;
        oContainer.addChild(oTextStroke);

        var oText = new createjs.Text(oTextStroke.text, iSize + "px " + FONT_GAME, szColor);
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

        createjs.Tween.get(oContainer).to({y: CANVAS_HEIGHT_HALF}, 500, createjs.Ease.cubicOut).call(function () {
            createjs.Tween.get(oContainer).wait(250).to({y: CANVAS_HEIGHT + oTextStroke.getBounds().height}, 500, createjs.Ease.cubicIn).call(function () {
                if (bStrobo) {
                    createjs.Tween.removeTweens(oText);
                }
                s_oStage.removeChild(oContainer);
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