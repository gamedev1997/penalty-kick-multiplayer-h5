function CInterface(bHideInitially) {
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
    var _oYourTurnContainer = null;

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

    this.showTurnMessage = function (bShow, bIsMyTurn) {
        if (!bShow) {
            if (_oYourTurnContainer) {
                var oTemp = _oYourTurnContainer;
                _oYourTurnContainer = null;
                createjs.Tween.get(oTemp, {override: true})
                    .to({ alpha: 0, scaleX: 0.7, scaleY: 0.7 }, 350, createjs.Ease.cubicIn)
                    .call(function() {
                        s_oStage.removeChild(oTemp);
                    });
            }
            return;
        }

        if (_oYourTurnContainer) {
            createjs.Tween.removeTweens(_oYourTurnContainer);
            s_oStage.removeChild(_oYourTurnContainer);
            _oYourTurnContainer = null;
        }

        _oYourTurnContainer = new createjs.Container();
        _oYourTurnContainer.x = CANVAS_WIDTH_HALF;
        _oYourTurnContainer.y = 25;
        _oYourTurnContainer.alpha = 0;
        _oYourTurnContainer.scaleX = 0.3;
        _oYourTurnContainer.scaleY = 0.3;

        // Customize style based on whose turn it is
        var sTextColor = bIsMyTurn ? "#ffcc00" : "#ff4444";
        var sBorderColor = bIsMyTurn ? "rgba(255, 204, 0, 0.75)" : "rgba(255, 68, 68, 0.75)";
        var sGlowColor = bIsMyTurn ? "#ffcc00" : "#ff4444";
        var sLabelText = bIsMyTurn ? "YOUR TURN TO SHOOT" : "OPPONENT'S TURN";

        // Background pill
        var oBg = new createjs.Shape();
        var iW = 230;
        var iH = 30;
        oBg.graphics.beginFill("rgba(0, 5, 20, 0.85)")
                    .beginStroke(sBorderColor)
                    .setStrokeStyle(2)
                    .drawRoundRect(-iW/2, -iH/2, iW, iH, iH/2);
        oBg.shadow = new createjs.Shadow(sGlowColor, 0, 0, 10);
        _oYourTurnContainer.addChild(oBg);

        // Title text
        var oText = new createjs.Text(sLabelText, "bold 15px " + FONT_GAME, sTextColor);
        oText.textAlign = "center";
        oText.textBaseline = "middle";
        oText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        _oYourTurnContainer.addChild(oText);

        s_oStage.addChild(_oYourTurnContainer);

        // Entrance animation
        createjs.Tween.get(_oYourTurnContainer)
            .to({ alpha: 1, scaleX: 1.0, scaleY: 1.0 }, 600, createjs.Ease.backOut);

        // Slight text pulsing
        createjs.Tween.get(oText, { loop: -1 })
            .to({ scaleX: 1.04, scaleY: 1.04 }, 900, createjs.Ease.sineInOut)
            .to({ scaleX: 1.0, scaleY: 1.0 }, 900, createjs.Ease.sineInOut);
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

        // Force all texts to uppercase for consistent premium sports feel
        if (szText) {
            szText = szText.toUpperCase();
        }

        // Determine animation type based on text content
        var sAnimType = 'default';
        if (szText === 'GOAL!') {
            sAnimType = 'goal';
        } else if (szText === 'SAVED!' || szText === TEXT_SAVED) {
            sAnimType = 'saved';
        } else if (szText === 'MISSED!' || szText === TEXT_BALL_OUT) {
            sAnimType = 'missed';
        } else if (szText === 'YOU WIN' || szText.indexOf('WIN') !== -1) {
            sAnimType = 'win';
        } else if (szText === 'YOU LOSE' || szText.indexOf('LOSE') !== -1) {
            sAnimType = 'lose';
        } else if (szText === 'MATCH TIE' || szText.indexOf('TIE') !== -1) {
            sAnimType = 'tie';
        }

        // Create premium styled text container
        var oContainer = new createjs.Container();
        var oText; // Refers to the front face text fill for animations/strobe

        if (sAnimType !== 'default') {
            var oCanvas = s_oStage.canvas || document.getElementById('canvas') || document.createElement('canvas');
            var ctx = oCanvas.getContext('2d');

            // Set typography to Teko ExtraBold
            var iFontSize = sAnimType === 'goal' ? 140 : 120;
            var sFont = "700 " + iFontSize + "px 'Teko'";

            // Custom configuration for each type of notification
            var oConfig = {
                gradientStops: [
                    {offset: 0, color: "#FFF3A8"},
                    {offset: 0.25, color: "#FFD700"},
                    {offset: 0.5, color: "#FFA500"},
                    {offset: 0.51, color: "#FF8C00"},
                    {offset: 0.85, color: "#FFB300"},
                    {offset: 1, color: "#B37400"}
                ],
                outlineColor: "#020B1E",
                outlineSize: 8,
                extrusionColor: "#613E00",
                extrusionOutlineColor: "#020B1E",
                extrusionDepth: 10,
                shadowColor: "rgba(0, 0, 0, 0.75)",
                shadowOffsetX: 1,
                shadowOffsetY: 1,
                shadowBlur: 15
            };

            if (sAnimType === 'saved') {
                oConfig = {
                    gradientStops: [
                        {offset: 0, color: "#E0FAFF"},
                        {offset: 0.25, color: "#00E5FF"},
                        {offset: 0.5, color: "#00B0FF"},
                        {offset: 0.51, color: "#0088FF"},
                        {offset: 0.85, color: "#0099FF"},
                        {offset: 1, color: "#0059B3"}
                    ],
                    outlineColor: "#00162B",
                    outlineSize: 7,
                    extrusionColor: "#003A70",
                    extrusionOutlineColor: "#00162B",
                    extrusionDepth: 8,
                    shadowColor: "rgba(0, 0, 0, 0.7)",
                    shadowOffsetX: 1,
                    shadowOffsetY: 1,
                    shadowBlur: 12
                };
            } else if (sAnimType === 'missed') {
                oConfig = {
                    gradientStops: [
                        {offset: 0, color: "#FFE5D9"},
                        {offset: 0.25, color: "#FF9800"},
                        {offset: 0.5, color: "#FF7700"},
                        {offset: 0.51, color: "#FF5500"},
                        {offset: 0.85, color: "#FF5A00"},
                        {offset: 1, color: "#9E3000"}
                    ],
                    outlineColor: "#170500",
                    outlineSize: 7,
                    extrusionColor: "#5E1D00",
                    extrusionOutlineColor: "#170500",
                    extrusionDepth: 8,
                    shadowColor: "rgba(0, 0, 0, 0.7)",
                    shadowOffsetX: 1,
                    shadowOffsetY: 1,
                    shadowBlur: 12
                };
            } else if (sAnimType === 'win') {
                oConfig = {
                    gradientStops: [
                        {offset: 0, color: "#FFF3A8"},
                        {offset: 0.25, color: "#FFD700"},
                        {offset: 0.5, color: "#FFA500"},
                        {offset: 0.51, color: "#FF8C00"},
                        {offset: 0.85, color: "#FFB300"},
                        {offset: 1, color: "#B37400"}
                    ],
                    outlineColor: "#020B1E",
                    outlineSize: 8,
                    extrusionColor: "#613E00",
                    extrusionOutlineColor: "#020B1E",
                    extrusionDepth: 10,
                    shadowColor: "rgba(0, 0, 0, 0.75)",
                    shadowOffsetX: 1,
                    shadowOffsetY: 1,
                    shadowBlur: 14
                };
            } else if (sAnimType === 'lose') {
                oConfig = {
                    gradientStops: [
                        {offset: 0, color: "#FFAAAA"},
                        {offset: 0.25, color: "#FF3B30"},
                        {offset: 0.5, color: "#D32F2F"},
                        {offset: 0.51, color: "#C01010"},
                        {offset: 0.85, color: "#990000"},
                        {offset: 1, color: "#660000"}
                    ],
                    outlineColor: "#0F0202",
                    outlineSize: 8,
                    extrusionColor: "#4A0000",
                    extrusionOutlineColor: "#0F0202",
                    extrusionDepth: 10,
                    shadowColor: "rgba(0, 0, 0, 0.75)",
                    shadowOffsetX: 1,
                    shadowOffsetY: 1,
                    shadowBlur: 14
                };
            } else if (sAnimType === 'tie') {
                oConfig = {
                    gradientStops: [
                        {offset: 0, color: "#FFFFFF"},
                        {offset: 0.25, color: "#E0E0E0"},
                        {offset: 0.5, color: "#BDBDBD"},
                        {offset: 0.51, color: "#9E9E9E"},
                        {offset: 0.85, color: "#757575"},
                        {offset: 1, color: "#424242"}
                    ],
                    outlineColor: "#111115",
                    outlineSize: 8,
                    extrusionColor: "#333333",
                    extrusionOutlineColor: "#111115",
                    extrusionDepth: 10,
                    shadowColor: "rgba(0, 0, 0, 0.75)",
                    shadowOffsetX: 1,
                    shadowOffsetY: 1,
                    shadowBlur: 14
                };
            }

            // Create linear gradient for the front face text
            var oGradient = ctx.createLinearGradient(0, -iFontSize / 2.2, 0, iFontSize / 2.2);
            for (var i = 0; i < oConfig.gradientStops.length; i++) {
                oGradient.addColorStop(oConfig.gradientStops[i].offset, oConfig.gradientStops[i].color);
            }

            // 1. Shadow Layer (lowest depth)
            var oShadowText = new createjs.Text(szText, sFont, "#000000");
            oShadowText.textAlign = "center";
            oShadowText.textBaseline = "middle";
            oShadowText.outline = oConfig.outlineSize + 4;
            oShadowText.x = oConfig.extrusionDepth + oConfig.shadowOffsetX;
            oShadowText.y = oConfig.extrusionDepth + oConfig.shadowOffsetY;
            oShadowText.shadow = new createjs.Shadow(oConfig.shadowColor, 0, 0, oConfig.shadowBlur);
            oContainer.addChild(oShadowText);

            // 2. 3D Extrusion block (rendered back-to-front)
            for (var d = oConfig.extrusionDepth; d >= 1; d--) {
                // Extrusion Outline
                var oExtrusionOutline = new createjs.Text(szText, sFont, oConfig.extrusionOutlineColor);
                oExtrusionOutline.textAlign = "center";
                oExtrusionOutline.textBaseline = "middle";
                oExtrusionOutline.outline = oConfig.outlineSize;
                oExtrusionOutline.x = d;
                oExtrusionOutline.y = d;
                oContainer.addChild(oExtrusionOutline);

                // Extrusion Fill
                var oExtrusionFill = new createjs.Text(szText, sFont, oConfig.extrusionColor);
                oExtrusionFill.textAlign = "center";
                oExtrusionFill.textBaseline = "middle";
                oExtrusionFill.x = d;
                oExtrusionFill.y = d;
                oContainer.addChild(oExtrusionFill);
            }

            // 3. Front Face Outline
            var oFrontOutline = new createjs.Text(szText, sFont, oConfig.outlineColor);
            oFrontOutline.textAlign = "center";
            oFrontOutline.textBaseline = "middle";
            oFrontOutline.outline = oConfig.outlineSize;
            oFrontOutline.x = 0;
            oFrontOutline.y = 0;
            oContainer.addChild(oFrontOutline);

            // 4. Front Face Gradient Fill
            var oFrontFill = new createjs.Text(szText, sFont, oGradient);
            oFrontFill.textAlign = "center";
            oFrontFill.textBaseline = "middle";
            oFrontFill.x = 0;
            oFrontFill.y = 0;
            oContainer.addChild(oFrontFill);

            oText = oFrontFill;
        } else {
            // Default styling for other general texts (like EXCELLENT, etc.)
            var iFontSize = iSize;
            var sFontWeight = 'bold';
            var sFont = sFontWeight + ' ' + iFontSize + 'px ' + FONT_GAME;

            var oTextStroke = new createjs.Text(szText, sFont, szColorStroke);
            oTextStroke.x = 0;
            oTextStroke.y = 0;
            oTextStroke.textAlign = "center";
            oTextStroke.textBaseline = "middle";
            oTextStroke.outline = 6;
            oContainer.addChild(oTextStroke);

            oText = new createjs.Text(szText, sFont, szColor);
            oText.x = 0;
            oText.y = 0;
            oText.textAlign = "center";
            oText.textBaseline = "middle";
            oText.shadow = new createjs.Shadow('#000000', 4, 4, 10);
            oContainer.addChild(oText);
        }

        // Position container
        oContainer.x = CANVAS_WIDTH_HALF;
        oContainer.y = sAnimType === 'missed' ? 120 : 160;

        s_oStage.addChild(oContainer);

        var self = s_oInterface;

        // GOAL & GAME END Animation - Celebration & Reward
        if (sAnimType === 'goal' || sAnimType === 'win' || sAnimType === 'lose' || sAnimType === 'tie') {
            oContainer.scaleX = 0.3;
            oContainer.scaleY = 0.3;
            oContainer.alpha = 0.8;
            
            createjs.Tween.get(oContainer)
                .to({ alpha: 1, scaleX: 1.2, scaleY: 1.2 }, 200, createjs.Ease.quartOut)
                .to({ scaleX: 1.0, scaleY: 1.0 }, 150, createjs.Ease.quartOut)
                .wait(1200)
                .to({ y: oContainer.y - 60, alpha: 0 }, 500, createjs.Ease.quartIn)
                .call(function () {
                    if (bStrobo) createjs.Tween.removeTweens(oText);
                    s_oStage.removeChild(oContainer);
                    if (self) self._playNextAnimText();
                });
        }
        // SAVED Animation - Quick Defensive Impact
        else if (sAnimType === 'saved') {
            oContainer.x = -300; // Start off-screen left
            oContainer.scaleX = 0.9;
            oContainer.scaleY = 0.9;
            
            createjs.Tween.get(oContainer)
                .to({ x: CANVAS_WIDTH_HALF, scaleX: 1.0, scaleY: 1.0 }, 180, createjs.Ease.quartOut)
                .call(function() {
                    // Impact shake
                    var iShakeX = oContainer.x;
                    createjs.Tween.get(oContainer)
                        .to({ x: iShakeX + 8 }, 40)
                        .to({ x: iShakeX - 6 }, 40)
                        .to({ x: iShakeX + 4 }, 40)
                        .to({ x: iShakeX }, 40);
                })
                .wait(800)
                .to({ alpha: 0, scaleX: 0.8, scaleY: 0.8 }, 300, createjs.Ease.quartIn)
                .call(function () {
                    if (bStrobo) createjs.Tween.removeTweens(oText);
                    s_oStage.removeChild(oContainer);
                    if (self) self._playNextAnimText();
                });
        }
        // MISSED Animation - Light Disappointment
        else if (sAnimType === 'missed') {
            oContainer.y = 60; // Start higher for drop effect
            oContainer.scaleX = 0.8;
            oContainer.scaleY = 1.3; // Squashed for stretch effect
            oContainer.alpha = 0.7;
            
            createjs.Tween.get(oContainer)
                .to({ 
                    y: 160, 
                    scaleX: 1.1, 
                    scaleY: 0.9, 
                    alpha: 1 
                }, 120, createjs.Ease.bounceOut)
                .to({ scaleX: 1.0, scaleY: 1.0 }, 100, createjs.Ease.quartOut)
                .wait(700)
                .to({ y: 220, alpha: 0, scaleX: 0.9, scaleY: 0.9 }, 400, createjs.Ease.quartIn)
                .call(function () {
                    if (bStrobo) createjs.Tween.removeTweens(oText);
                    s_oStage.removeChild(oContainer);
                    if (self) self._playNextAnimText();
                });
        }
        // Default animation for other texts
        else {
            oContainer.alpha = 0;
            oContainer.scaleX = 0.4;
            oContainer.scaleY = 0.4;
            
            createjs.Tween.get(oContainer)
                .to({ alpha: 1, scaleX: 1.1, scaleY: 1.1 }, 250, createjs.Ease.quartOut)
                .to({ scaleX: 1.0, scaleY: 1.0 }, 150, createjs.Ease.quartOut)
                .wait(1000)
                .to({ alpha: 0, scaleX: 0.7, scaleY: 0.7 }, 250, createjs.Ease.cubicIn)
                .call(function () {
                    if (bStrobo) createjs.Tween.removeTweens(oText);
                    s_oStage.removeChild(oContainer);
                    if (self) self._playNextAnimText();
                });
        }

        // Apply strobe effect if needed
        if (bStrobo) {
            s_oInterface.strobeText(oText);
        }
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

    this._init(bHideInitially);

    return this;
}

var s_oInterface = null;