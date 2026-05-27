function CGoalKeeper(iXPos, iYPos, oParentContainer) {
    var _pStartPos;
    var _oContainer;
    var _aAnimContainer;
    var _oParentContainer;
    var _aAllAnim;
    var _fBuffer = 0;
    var _iAnimKeeper = 0;
    var _iAnimType = IDLE;
    var _iState = STATE_GK_IDLE;
    var _bDirectionLocked = false;
    var _iTargetAnim = -1;
    var _fAnimSpeedScale = 1.0;

    this._init = function (iXPos, iYPos, oParentContainer) {

        _oParentContainer = oParentContainer;

        _pStartPos = {x: iXPos, y: iYPos};
        _oContainer = new createjs.Container();
        _oContainer.x = _pStartPos.x;
        _oContainer.y = _pStartPos.y;
        _oParentContainer.addChild(_oContainer);
        _oContainer.tickChildren = false;

        _aAllAnim = new Array();
        _aAnimContainer = new Array();

        var iWidthMax = 0;
        var iHeightMax = 0;


        for (var i = 0; i < NUM_SPRITE_GOALKEEPER.length; i++) {
            _aAnimContainer[i] = new createjs.Container();
            _aAnimContainer[i].regX = -OFFSET_CONTAINER_GOALKEEPER[i].x;
            _aAnimContainer[i].regY = -OFFSET_CONTAINER_GOALKEEPER[i].y;
            _aAllAnim.push(this.loadAnim(SPRITE_NAME_GOALKEEPER[i], NUM_SPRITE_GOALKEEPER[i], _aAnimContainer[i]));
            _oContainer.addChild(_aAnimContainer[i]);

            var oSprite = s_oSpriteLibrary.getSprite(SPRITE_NAME_GOALKEEPER[i] + 0);
            if (oSprite.width > iWidthMax) {
                iWidthMax = oSprite.width;
            }

            if (oSprite.height > iHeightMax) {
                iHeightMax = oSprite.height;
            }
        }

        _oContainer.cache(-iWidthMax, -iHeightMax, iWidthMax * 2, iHeightMax * 2);

        _aAllAnim[IDLE][0].visible = true;
    };

    this.getAnimType = function () {
        return _iAnimType;
    };

    this.getAnimArray = function () {
        return _aAllAnim[_iAnimType];
    };

    this.loadAnim = function (szSprite, iNum, oContainer) {
        var aAnim = new Array();
        for (var i = 0; i < iNum; i++) {
            aAnim.push(createBitmap(s_oSpriteLibrary.getSprite(szSprite + i)));
            aAnim[i].visible = false;
            oContainer.addChild(aAnim[i]);
        }
        return aAnim;
    };

    this.getX = function () {
        return _oContainer.x;
    };

    this.getY = function () {
        return _oContainer.y;
    };

    this.disableAllAnim = function () {
        for (var i = 0; i < _aAnimContainer.length; i++) {
            _aAnimContainer[i].visible = false;
        }
    };

    this.setPosition = function (iXPos, iYPos) {
        _oContainer.x = iXPos;
        _oContainer.y = iYPos;
    };

    this.setVisible = function (bVal) {
        _oContainer.visible = bVal;
    };

    this.fadeAnimation = function (fVal) {
        createjs.Tween.get(_oContainer, {override: true}).to({alpha: fVal}, 500);
    };

    this.setAlpha = function (fVal) {
        _oContainer.alpha = fVal;
    };

    this.getObject = function () {
        return _oContainer;
    };

    this.getFrame = function () {
        return _iAnimKeeper;
    };

    this.viewFrame = function (aAnim, iFrame) {
        aAnim[iFrame].visible = true;
    };

    this.hideFrame = function (aAnim, iFrame) {
        aAnim[iFrame].visible = false;
    };

    this.getDepthPos = function () {
        return GOAL_KEEPER_DEPTH_Y;
    };

    this.animGoalKeeper = function (aAnim, iEndFrame) {
        _fBuffer += s_iTimeElaps * _fAnimSpeedScale;
        if (_fBuffer > BUFFER_ANIM_PLAYER) {
            this.hideFrame(aAnim, _iAnimKeeper);
            if (_iAnimKeeper + 1 < iEndFrame) {
                this.viewFrame(aAnim, _iAnimKeeper + 1);
                _iAnimKeeper++;

            } else {
                _iAnimKeeper = 0;
                _fBuffer = 0;
                this.viewFrame(aAnim, _iAnimKeeper);
                return false;
            }
            _fBuffer = 0;
            _oContainer.updateCache();
        }
        return true;
    };

    this.resetAnimation = function (iType) {
        this.resetAnimFrame(_aAllAnim[iType], NUM_SPRITE_GOALKEEPER[iType]);
    };

    this.resetAnimFrame = function (aAnim, iNum) {
        for (var i = 1; i < iNum; i++) {
            aAnim[i].visible = false;
        }
        aAnim[0].visible = true;
    };

    this.setVisibleContainer = function (iType, bVal) {
        _aAnimContainer[iType].visible = bVal;
    };

    this.runAnim = function (iVal) {
        this.disableAllAnim();
        this.resetAnimation(iVal);
        this.setVisibleContainer(iVal, true);
        _iAnimType = iVal;
        _iAnimKeeper = 0;
        _fBuffer = 0;
        _fAnimSpeedScale = 1.0;
    };

    // Save dive: anticipation lean → accelerating dive → hold at landing → smooth recovery
    this.runAnimAndShift = function (iVal, pBallFinalPos, fAnticTime, fDiveTime, fAnimSpeedScale, fErrorX, fErrorY) {
        if (_bDirectionLocked) { return; }
        _bDirectionLocked = true;

        _iState = STATE_GK_PREPARE;
        _iTargetAnim = iVal;

        fAnticTime = fAnticTime || 100;
        fDiveTime = fDiveTime || 400;
        _fAnimSpeedScale = fAnimSpeedScale || 1.0;
        fErrorX = fErrorX || 0;
        fErrorY = fErrorY || 0;

        var self = this;
        var pOriginImpact = ORIGIN_POINT_IMPACT_ANIMATION[iVal];

        // Horizontal correction: shift GK left/right so hands align with predicted ball X.
        var iX = (pOriginImpact.x !== null) ? (pBallFinalPos.x - pOriginImpact.x) : 0;
        iX = Math.max(-520, Math.min(520, iX + fErrorX));

        // Vertical correction: permit only UPWARD correction (iY < 0)
        var iYRaw = (pOriginImpact.y !== null) ? (pBallFinalPos.y - pOriginImpact.y) : 0;
        var iY = Math.max(-110, Math.min(0, iYRaw + fErrorY));

        // Anticipation lean: lean TOWARD the ball!
        var fAnticX = Math.sign(pBallFinalPos.x) * Math.min(Math.abs(iX) * 0.22, 44);
        var fAnticY = 0;

        this.disableAllAnim();
        this.resetAnimation(iVal);
        this.setVisibleContainer(iVal, true);
        _iAnimType = iVal;
        _iAnimKeeper = 0;
        _fBuffer = 0;

        // Unified Phase 1 & 2 – Single fluid athletic sweep to the save contact position (fAnticTime + fDiveTime ms)
        createjs.Tween.get(_oContainer, { override: true })
            .to({ x: _pStartPos.x + iX, y: _pStartPos.y + iY }, fAnticTime + fDiveTime, createjs.Ease.quadInOut)
            .call(function () {
                _iState = STATE_GK_SAVE_CONTACT;

                // Phase 3 – Absorb impact (300 ms hold), then float back to idle
                createjs.Tween.get(_oContainer, { override: true })
                    .wait(300)
                    .call(function () {
                        _iState = STATE_GK_RECOVER;
                    })
                    .to({ x: _pStartPos.x, y: _pStartPos.y }, 480, createjs.Ease.quadOut)
                    .call(function () {
                        _iState = STATE_GK_IDLE;
                        _bDirectionLocked = false;
                        self.runAnim(IDLE);
                    });
            });

        // Parallel timeline to update goalkeeper state transitions in sync with visual stages
        createjs.Tween.get(this, { override: true })
            .wait(fAnticTime)
            .call(function () {
                _iState = STATE_GK_DIVE;
            });
    };

    // Wrong-direction dive when ball scores: GK commits convincingly but cannot reach it
    this.runAnimWrongDir = function (iVal, fAnticTime, fDiveTime, fAnimSpeedScale) {
        if (_bDirectionLocked) { return; }
        _bDirectionLocked = true;

        _iState = STATE_GK_PREPARE;
        _iTargetAnim = iVal;

        fAnticTime = fAnticTime || 115;
        fDiveTime = fDiveTime || 450;
        _fAnimSpeedScale = fAnimSpeedScale || 1.0;

        var self = this;

        // Map animation type to its natural body-movement direction
        var fDirX = 0, fDirY = 0;
        switch (iVal) {
            case RIGHT:           fDirX =  1.0; fDirY =  0.0; break;
            case LEFT:            fDirX = -1.0; fDirY =  0.0; break;
            case CENTER_DOWN:     fDirX =  0.0; fDirY =  0.7; break;
            case CENTER_UP:       fDirX =  0.0; fDirY = -0.7; break;
            case LEFT_DOWN:       fDirX = -0.7; fDirY =  0.5; break;
            case RIGHT_DOWN:      fDirX =  0.7; fDirY =  0.5; break;
            case CENTER:          fDirX =  0.0; fDirY =  0.0; break;
            case SIDE_LEFT:       fDirX = -0.6; fDirY =  0.0; break;
            case SIDE_RIGHT:      fDirX =  0.6; fDirY =  0.0; break;
            case SIDE_LEFT_UP:    fDirX = -0.6; fDirY = -0.4; break;
            case SIDE_RIGHT_UP:   fDirX =  0.6; fDirY = -0.4; break;
            case SIDE_LEFT_DOWN:  fDirX = -0.6; fDirY =  0.4; break;
            case SIDE_RIGHT_DOWN: fDirX =  0.6; fDirY =  0.4; break;
            case LEFT_UP:         fDirX = -1.0; fDirY = -0.5; break;
            case RIGHT_UP:        fDirX =  1.0; fDirY = -0.5; break;
            default:              fDirX =  0.0; fDirY =  0.0; break;
        }

        var iShiftX = fDirX * 72;
        var iShiftY = fDirY * 38;

        this.disableAllAnim();
        this.resetAnimation(iVal);
        this.setVisibleContainer(iVal, true);
        _iAnimType = iVal;
        _iAnimKeeper = 0;
        _fBuffer = 0;

        // Unified Phase 1 & 2 – Single fluid wrong-direction sweep (fAnticTime + fDiveTime ms)
        createjs.Tween.get(_oContainer, { override: true })
            .to({ x: _pStartPos.x + iShiftX, y: _pStartPos.y + iShiftY }, fAnticTime + fDiveTime, createjs.Ease.quadInOut)
            .call(function () {
                _iState = STATE_GK_SAVE_CONTACT;

                // Phase 3 – Hold committed position (420 ms), then recover
                createjs.Tween.get(_oContainer, { override: true })
                    .wait(420)
                    .call(function () {
                        _iState = STATE_GK_RECOVER;
                    })
                    .to({ x: _pStartPos.x, y: _pStartPos.y }, 500, createjs.Ease.quadOut)
                    .call(function () {
                        _iState = STATE_GK_IDLE;
                        _bDirectionLocked = false;
                        self.runAnim(IDLE);
                    });
            });

        // Parallel timeline to update goalkeeper state transitions in sync with visual stages
        createjs.Tween.get(this, { override: true })
            .wait(fAnticTime)
            .call(function () {
                _iState = STATE_GK_DIVE;
            });
    };

    // Snap GK container back to spawn — call before alpha fade-in on round reset
    this.resetToStartPosition = function () {
        createjs.Tween.removeTweens(_oContainer);
        _oContainer.x = _pStartPos.x;
        _oContainer.y = _pStartPos.y;
        _iState = STATE_GK_IDLE;
        _bDirectionLocked = false;
        _iTargetAnim = -1;
    };

    this.getState = function () {
        return _iState;
    };

    this.isDirectionLocked = function () {
        return _bDirectionLocked;
    };

    this.update = function () {
        if (_iState === STATE_GK_IDLE) {
            // Grounded athletic footwork sway (subtle bouncing on toes and shifting weight) - slowed down
            var time = createjs.Ticker.getTime();
            _oContainer.y = _pStartPos.y + Math.sin(time * 0.003) * 3; // bounce (slower, lower amplitude)
            _oContainer.x = _pStartPos.x + Math.sin(time * 0.001) * 8;  // sway side to side (slower, lower amplitude)
        }
        return this.animGoalKeeper(_aAllAnim[_iAnimType], NUM_SPRITE_GOALKEEPER[_iAnimType]);
    };

    this._init(iXPos, iYPos, oParentContainer);

    return this;
}

