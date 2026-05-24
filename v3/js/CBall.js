// function CBall(iXPos, iYPos, oSprite, oPhysics, oParentContainer) {

//     var _oBall;
//     var _oParentContainer;
//     var _oPhysics;
//     var _oShadow;
//     var _oContainer;
//     var _fStartShadowPos = null;
//     var _fScale = (FOV) * BALL_RADIUS;
//     var _fScaleShadow = _fScale;
//     var _iBufferTime = 0;
//     var _iFrame = 0;
//     var _oTween = null;

//     this._init = function (iXPos, iYPos, oSprite) {
//         _oContainer = new createjs.Container();
//         _oParentContainer.addChild(_oContainer);

//         var oData = {
//             images: [oSprite],
//             // width, height & registration point of each sprite
//             frames: {width: oSprite.width / 7, height: oSprite.height, regX: (oSprite.width / 2) / 7, regY: oSprite.height / 2}
//         };
//         var oSpriteSheet = new createjs.SpriteSheet(oData);
//         _oBall = createSprite(oSpriteSheet, 0, (oSprite.width / 2) / 7, oSprite.height / 2, oSprite.width / 7, oSprite.height / 2);
//         _oBall.stop();
//         this.scale(_fScale);

//         var oSpriteShadow = s_oSpriteLibrary.getSprite("ball_shadow");
//         _oShadow = createBitmap(oSpriteShadow);
//         _oShadow.x = iXPos;
//         _oShadow.y = iYPos;
//         _oShadow.regX = oSpriteShadow.width * 0.5;
//         _oShadow.regY = oSpriteShadow.height * 0.5;

//         this.scaleShadow(_fScaleShadow);

//         _oContainer.addChild(_oShadow, _oBall);
//     };

//     this.rolls = function () {
//         var iForceX = _oPhysics.velocity.x * 0.15;

//         var fAngle = Math.sin(-iForceX);

//         _oBall.rotation = fAngle * (180/Math.PI)//Math.degrees(fAngle);

//         var iForceY = Math.abs(_oPhysics.angularVelocity.x);

//         var oFuncRot = this._goToPrevFrame;

//         if (_oPhysics.angularVelocity.x < 0) {
//             oFuncRot = this._goToNextFrame;
//         }

//         if (iForceY > 7) {
//             oFuncRot();
//         } else if (iForceY > 3) {
//             _iBufferTime++;
//             if (_iBufferTime > 2 / ROLL_BALL_RATE) {
//                 oFuncRot();
//                 _iBufferTime = 0;
//             }
//         } else if (iForceY > 1) {
//             _iBufferTime++;
//             if (_iBufferTime > 3 / ROLL_BALL_RATE) {
//                 oFuncRot();
//                 _iBufferTime = 0;
//             }
//         } else if (iForceY > MIN_BALL_VEL_ROTATION) {
//             _iBufferTime++;
//             if (_iBufferTime > 4 / ROLL_BALL_RATE) {
//                 oFuncRot();
//                 _iBufferTime = 0;
//             }
//         }
//     };

//     this._goToPrevFrame = function () {
//         if (_iFrame === 0) {
//             _iFrame = 6;
//             _oBall.gotoAndStop(_iFrame);
//         } else {
//             _iFrame--;
//             _oBall.gotoAndStop(_iFrame);
//         }
//     };

//     this._goToNextFrame = function () {
//         if (_iFrame === 7) {
//             _iFrame = 1;
//             _oBall.gotoAndStop(_iFrame);
//         } else {
//             _iFrame++;
//             _oBall.gotoAndStop(_iFrame);
//         }
//     };

//     this.unload = function () {
//         _oBall.removeAllEventListeners();
//         _oParentContainer.removeChild(_oBall);
//     };

//     this.setVisible = function (bVisible) {
//         _oContainer.visible = bVisible;
//     };

//     this.getStartScale = function () {
//         return _fScaleShadow;
//     };

//     this.startPosShadowY = function (fYPos) {
//         _fStartShadowPos = fYPos;
//     };

//     this.getStartShadowYPos = function () {
//         return _fStartShadowPos;
//     };

//     this.fadeAnimation = function (fVal, iTime, iWait) {
//         this.tweenFade(fVal, iTime, iWait);

//     };

//     this.tweenFade = function (fVal, iTime, iWait) {
//         _oTween = createjs.Tween.get(_oContainer, {override: true}).wait(iWait).to({alpha: fVal}, iTime).call(function () {
//             _oTween = null;
//         });
//     };

//     this.setPositionShadow = function (iX, iY) {
//         _oShadow.x = iX;
//         _oShadow.y = iY;
//     };

//     this.setPosition = function (iXPos, iYPos) {
//         _oBall.x = iXPos;
//         _oBall.y = iYPos;
//     };

//     this.getPhysics = function () {
//         return _oPhysics;
//     };

//     this.setAngle = function (iAngle) {
//         _oBall.rotation = iAngle;
//     };

//     this.getX = function () {
//         return _oBall.x;
//     };

//     this.getY = function () {
//         return _oBall.y;
//     };

//     this.getStartScale = function () {
//         return _fScale;
//     };

//     this.scale = function (fValue) {
//         _oBall.scaleX = fValue;
//         _oBall.scaleY = fValue;
//     };

//     this.scaleShadow = function (fScale) {
//         if (fScale > 0.08) {
//             _oShadow.scaleX = fScale;
//             _oShadow.scaleY = fScale;
//         } else {
//             _oShadow.scaleX = 0.08;
//             _oShadow.scaleY = 0.08;
//         }
//     };

//     this.setAlphaByHeight = function (fHeight) {
//         _oShadow.alpha = fHeight;
//     };

//     this.getScale = function () {
//         return _oBall.scaleX;
//     };

//     this.getObject = function () {
//         return _oContainer;
//     };

//     this.getDepthPos = function () {
//         return _oPhysics.position.y;
//     };

//     _oPhysics = oPhysics;
//     _oParentContainer = oParentContainer;

//     this._init(iXPos, iYPos, oSprite);

//     return this;
// }



// New code 

function CBall(iXPos, iYPos, oSprite, oPhysics, oParentContainer) {

    var _oBall;
    var _oParentContainer;
    var _oPhysics;
    var _oShadow;
    var _oContainer;
    var _fStartShadowPos = null;
    var _fScale = (FOV) * BALL_RADIUS;
    var _fScaleShadow = _fScale;
    var _iBufferTime = 0;
    var _iFrame = 0;
    var _oTween = null;

    // --- Physics improvement: spin tracking ---
    var _fSpinAccum = 0;       // accumulated spin (sub-frame precision)
    var _fLastAngVel = 0;      // previous angular velocity (for smoothing)
    var _fTiltAngle = 0;       // current visual tilt (smoothed)

    this._init = function (iXPos, iYPos, oSprite) {
        _oContainer = new createjs.Container();
        _oParentContainer.addChild(_oContainer);

        var oData = {
            images: [oSprite],
            frames: {width: oSprite.width / 7, height: oSprite.height, regX: (oSprite.width / 2) / 7, regY: oSprite.height / 2}
        };
        var oSpriteSheet = new createjs.SpriteSheet(oData);
        _oBall = createSprite(oSpriteSheet, 0, (oSprite.width / 2) / 7, oSprite.height / 2, oSprite.width / 7, oSprite.height / 2);
        _oBall.stop();
        this.scale(_fScale);

        var oSpriteShadow = s_oSpriteLibrary.getSprite("ball_shadow");
        _oShadow = createBitmap(oSpriteShadow);
        _oShadow.x = iXPos;
        _oShadow.y = iYPos;
        _oShadow.regX = oSpriteShadow.width * 0.5;
        _oShadow.regY = oSpriteShadow.height * 0.5;

        this.scaleShadow(_fScaleShadow);

        _oContainer.addChild(_oShadow, _oBall);
    };

    this.rolls = function () {
        // --- IMPROVED: Smooth tilt using velocity direction ---
        var iForceX = _oPhysics.velocity.x * 0.15;
        var fTargetTilt = Math.sin(-iForceX) * (180 / Math.PI);

        // Lerp tilt angle for smooth rotation feel (not snappy)
        _fTiltAngle += (fTargetTilt - _fTiltAngle) * 0.18;
        _oBall.rotation = _fTiltAngle;

        // --- IMPROVED: Smooth angular velocity with momentum bleed ---
        var iRawAngVel = _oPhysics.angularVelocity.x;

        // Blend previous and current angular velocity (prevents jitter)
        var iForceY = Math.abs(iRawAngVel * 0.7 + _fLastAngVel * 0.3);
        _fLastAngVel = iRawAngVel;

        var oFuncRot = this._goToPrevFrame;
        if (iRawAngVel < 0) {
            oFuncRot = this._goToNextFrame;
        }

        // --- IMPROVED: Sub-frame spin accumulation for smooth low-speed roll ---
        // Instead of discrete buffer steps, accumulate fractional spin and
        // advance frame only when enough spin has built up.
        var fSpinRate;
        if (iForceY > 7) {
            fSpinRate = 1.0;                          // fast roll: every frame
        } else if (iForceY > 3) {
            fSpinRate = iForceY / 7 * ROLL_BALL_RATE; // medium: proportional
        } else if (iForceY > 1) {
            fSpinRate = iForceY / 14 * ROLL_BALL_RATE;
        } else if (iForceY > MIN_BALL_VEL_ROTATION) {
            fSpinRate = iForceY / 28 * ROLL_BALL_RATE; // creeping roll
        } else {
            fSpinRate = 0;                             // fully stopped
        }

        if (fSpinRate > 0) {
            _fSpinAccum += fSpinRate;
            if (_fSpinAccum >= 1.0) {
                var iSteps = Math.floor(_fSpinAccum);  // advance multiple frames if very fast
                for (var i = 0; i < iSteps; i++) {
                    oFuncRot();
                }
                _fSpinAccum -= iSteps;
            }
        } else {
            // Ball stopped — drain spin accumulator gradually (feels like it coasts to a stop)
            _fSpinAccum *= 0.85;
            if (_fSpinAccum > 0.5) {
                oFuncRot();
                _fSpinAccum -= 1.0;
            }
        }

        // Reset buffer (no longer needed but kept to avoid breaking any external references)
        _iBufferTime = 0;
    };

    this._goToPrevFrame = function () {
        if (_iFrame === 0) {
            _iFrame = 6;
            _oBall.gotoAndStop(_iFrame);
        } else {
            _iFrame--;
            _oBall.gotoAndStop(_iFrame);
        }
    };

    this._goToNextFrame = function () {
        if (_iFrame === 7) {
            _iFrame = 1;
            _oBall.gotoAndStop(_iFrame);
        } else {
            _iFrame++;
            _oBall.gotoAndStop(_iFrame);
        }
    };

    this.unload = function () {
        _oBall.removeAllEventListeners();
        _oParentContainer.removeChild(_oBall);
    };

    this.setVisible = function (bVisible) {
        _oContainer.visible = bVisible;
    };

    this.getStartScale = function () {
        return _fScaleShadow;
    };

    this.startPosShadowY = function (fYPos) {
        _fStartShadowPos = fYPos;
    };

    this.getStartShadowYPos = function () {
        return _fStartShadowPos;
    };

    this.fadeAnimation = function (fVal, iTime, iWait) {
        this.tweenFade(fVal, iTime, iWait);
    };

    this.tweenFade = function (fVal, iTime, iWait) {
        _oTween = createjs.Tween.get(_oContainer, {override: true}).wait(iWait).to({alpha: fVal}, iTime).call(function () {
            _oTween = null;
        });
    };

    this.setPositionShadow = function (iX, iY) {
        _oShadow.x = iX;
        _oShadow.y = iY;
    };

    this.setPosition = function (iXPos, iYPos) {
        _oBall.x = iXPos;
        _oBall.y = iYPos;
    };

    this.getPhysics = function () {
        return _oPhysics;
    };

    this.setAngle = function (iAngle) {
        _oBall.rotation = iAngle;
    };

    this.getX = function () {
        return _oBall.x;
    };

    this.getY = function () {
        return _oBall.y;
    };

    this.getStartScale = function () {
        return _fScale;
    };

    this.scale = function (fValue) {
        _oBall.scaleX = fValue;
        _oBall.scaleY = fValue;
    };

    this.scaleShadow = function (fScale) {
        if (fScale > 0.08) {
            _oShadow.scaleX = fScale;
            _oShadow.scaleY = fScale;
        } else {
            _oShadow.scaleX = 0.08;
            _oShadow.scaleY = 0.08;
        }
    };

    this.setAlphaByHeight = function (fHeight) {
        _oShadow.alpha = fHeight;
    };

    this.getScale = function () {
        return _oBall.scaleX;
    };

    this.getObject = function () {
        return _oContainer;
    };

    this.getDepthPos = function () {
        return _oPhysics.position.y;
    };

    _oPhysics = oPhysics;
    _oParentContainer = oParentContainer;

    this._init(iXPos, iYPos, oSprite);

    return this;
}