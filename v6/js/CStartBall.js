function CStartBall(iX, iY, oParetContainer) {

    var _oParentContainer = oParetContainer;
    var _oContainer;
    var _oStartBall;
    var _oGlow;
    var _bGlowActive = false;
    
    this._fGlowPulse = 1.0;
    this._fGlowAlpha = 0.85;

    this._init = function () {
        var oSpriteStartBall = s_oSpriteLibrary.getSprite("start_ball");

        _oContainer = new createjs.Container();
        _oContainer.x = iX;
        _oContainer.y = iY;
        _oParentContainer.addChild(_oContainer);

        // Create radial yellow/gold glow shape behind the ball
        _oGlow = new createjs.Shape();
        _oGlow.graphics.beginRadialGradientFill(["rgba(255, 204, 0, 0.85)", "rgba(255, 204, 0, 0)"], [0, 1], 0, 0, 0, 0, 0, 50)
                      .drawCircle(0, 0, 50);
        _oGlow.visible = false;
        _oContainer.addChild(_oGlow);

        _oStartBall = createBitmap(oSpriteStartBall);
        _oStartBall.regX = oSpriteStartBall.width * 0.5;
        _oStartBall.regY = oSpriteStartBall.height * 0.5;
        _oContainer.addChild(_oStartBall);
    };

    this.setPosition = function (iX, iY) {
        _oContainer.x = iX;
        _oContainer.y = iY;
    };

    this.fadeAnim = function (fVal, iTime, iWait) {
        createjs.Tween.get(_oContainer, {override: true}).wait(iWait).to({alpha: fVal}, iTime);
    };

    this.setAlpha = function (fVal) {
        _oContainer.alpha = fVal;
    };

    this.setVisible = function (bVal) {
        _oContainer.visible = bVal;
        if (!bVal) {
            this.showGlow(false); // turn off glow when ball becomes invisible
        }
    };

    this.showGlow = function (bShow) {
        _bGlowActive = bShow;
        if (bShow) {
            _oGlow.visible = true;
            _oGlow.alpha = 0.85;
            _fGlowPulse = 1.0;
            createjs.Tween.removeTweens(this);
            var self = this;
            createjs.Tween.get(this, {loop: -1, override: true})
                .to({_fGlowPulse: 1.35, _fGlowAlpha: 0.3}, 900, createjs.Ease.sineInOut)
                .to({_fGlowPulse: 1.0, _fGlowAlpha: 0.85}, 900, createjs.Ease.sineInOut)
                .addEventListener("change", function() {
                    if (_oGlow && _bGlowActive) {
                        _oGlow.alpha = self._fGlowAlpha;
                        _oGlow.scaleX = self._fGlowPulse;
                        _oGlow.scaleY = self._fGlowPulse;
                    }
                });
        } else {
            createjs.Tween.removeTweens(this);
            if (_oGlow) {
                createjs.Tween.get(_oGlow, {override: true}).to({alpha: 0}, 200).call(function() {
                    _oGlow.visible = false;
                });
            }
        }
    };

    this.unload = function () {
        createjs.Tween.removeTweens(this);
        if (_oGlow) {
            createjs.Tween.removeTweens(_oGlow);
        }
        _oParentContainer.removeChild(_oContainer);
    };

    this._init();
    return this;
}