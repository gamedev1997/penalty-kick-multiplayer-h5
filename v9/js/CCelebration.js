function CCelebration(oParentContainer) {
    var _oParentContainer = oParentContainer;
    var _oContainer;
    var _aFrames = [];
    var _iCurFrame = 0;
    var _bPlaying = false;
    var _iTimeElaps = 0;
    var _iFrameRateMs = 40; // 25 fps = 40ms per frame

    this._init = function () {
        _oContainer = new createjs.Container();
        _oContainer.x = CANVAS_WIDTH_HALF - 160; // 1360 / 2 - 320 / 2 = 520
        _oContainer.y = 0;
        _oContainer.visible = false;
        _oContainer.alpha = 0;

        for (var i = 1; i <= 26; i++) {
            var oBmp = createBitmap(s_oSpriteLibrary.getSprite("celebration_frame_" + i));
            oBmp.visible = false;
            _oContainer.addChild(oBmp);
            _aFrames.push(oBmp);
        }

        _oParentContainer.addChild(_oContainer);
    };

    this.play = function (iDurationMs) {
        if (_bPlaying) {
            createjs.Tween.removeTweens(_oContainer);
        }
        _iCurFrame = 0;
        _iTimeElaps = 0;
        _bPlaying = true;

        for (var i = 0; i < _aFrames.length; i++) {
            _aFrames[i].visible = (i === 0);
        }

        _oContainer.visible = true;
        _oContainer.alpha = 1;

        var self = this;
        createjs.Tween.get(_oContainer)
            .wait(iDurationMs - 500)
            .to({ alpha: 0 }, 500)
            .call(function () {
                self.stop();
            });
    };

    this.stop = function () {
        _bPlaying = false;
        _oContainer.visible = false;
        _oContainer.alpha = 0;
    };

    this.update = function () {
        if (!_bPlaying) {
            return;
        }

        _iTimeElaps += s_iTimeElaps;
        if (_iTimeElaps >= _iFrameRateMs) {
            var iFrameAdvance = Math.floor(_iTimeElaps / _iFrameRateMs);
            _iTimeElaps %= _iFrameRateMs;

            _aFrames[_iCurFrame].visible = false;
            _iCurFrame = (_iCurFrame + iFrameAdvance) % _aFrames.length;
            _aFrames[_iCurFrame].visible = true;
        }
    };

    this.unload = function () {
        createjs.Tween.removeTweens(_oContainer);
        _oParentContainer.removeChild(_oContainer);
    };

    this._init();
}
