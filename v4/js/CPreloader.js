function CPreloader() {
    var _iMaskWidth;
    var _iMaskHeight;
    var _oLoadingText;
    var _oProgressBar;
    var _oMaskPreloader;
    var _oFade;
    var _oIcon;
    var _oIconMask;
    var _oContainer;

    this._init = function () {
        s_oSpriteLibrary.init(this._onImagesLoaded, this._onAllImagesLoaded, this);
        s_oSpriteLibrary.addSprite("progress_bar", "./sprites/progress_bar.png");
        s_oSpriteLibrary.addSprite("200x200", "./sprites/200x200.png");

        s_oSpriteLibrary.loadSprites();

        _oContainer = new createjs.Container();
        s_oStage.addChild(_oContainer);

    };

    this.unload = function () {
        _oContainer.removeAllChildren();

    };

    this._onImagesLoaded = function () {

    };

    this._onAllImagesLoaded = function () {

        this.attachSprites();

        s_oMain.preloaderReady();

    };

    this.attachSprites = function () {

        // ===== MAIN BG =====
        var oBg = new createjs.Shape();
        oBg.graphics
            .beginLinearGradientFill(
                ["#020c18", "#051a2e", "#0a1628"],
                [0, 0.5, 1],
                0, 0, 0, CANVAS_HEIGHT
            )
            .drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        _oContainer.addChild(oBg);

        // ===== GRID OVERLAY (CSS wala effect) =====
        var oGrid = new createjs.Shape();
        var g = oGrid.graphics;

        g.setStrokeStyle(1);

        // Vertical Lines
        g.beginStroke("rgba(255,255,255,0.015)");
        for (var i = 0; i <= CANVAS_WIDTH; i += 60) {
            g.moveTo(i, 0);
            g.lineTo(i, CANVAS_HEIGHT);
        }

        // Horizontal Lines
        for (var j = 0; j <= CANVAS_HEIGHT; j += 60) {
            g.moveTo(0, j);
            g.lineTo(CANVAS_WIDTH, j);
        }

        g.endStroke();

        _oContainer.addChild(oGrid);

        // ===== GLOW LEFT =====
        var oGlow1 = new createjs.Shape();
        oGlow1.graphics.beginRadialGradientFill(
            [
                "rgba(34,197,94,0.18)",
                "rgba(34,197,94,0)"
            ],
            [0, 1],
            CANVAS_WIDTH * 0.2,
            CANVAS_HEIGHT * 0.5,
            0,
            CANVAS_WIDTH * 0.2,
            CANVAS_HEIGHT * 0.5,
            CANVAS_WIDTH * 0.35
        ).drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        _oContainer.addChild(oGlow1);

        // ===== GLOW RIGHT =====
        var oGlow2 = new createjs.Shape();
        oGlow2.graphics.beginRadialGradientFill(
            [
                "rgba(59,130,246,0.12)",
                "rgba(59,130,246,0)"
            ],
            [0, 1],
            CANVAS_WIDTH * 0.8,
            CANVAS_HEIGHT * 0.45,
            0,
            CANVAS_WIDTH * 0.8,
            CANVAS_HEIGHT * 0.45,
            CANVAS_WIDTH * 0.38
        ).drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        _oContainer.addChild(oGlow2);

        // ===== ICON — shown above title =====
        var oSprite = s_oSpriteLibrary.getSprite('200x200');
        _oIcon = createBitmap(oSprite);
        _oIcon.regX = oSprite.width * 0.5;
        _oIcon.regY = oSprite.height * 0.5;
        _oIcon.x = CANVAS_WIDTH / 2;
        _oIcon.y = CANVAS_HEIGHT / 2 - 170;
        _oIcon.scaleX = 0.65;
        _oIcon.scaleY = 0.65;
        _oContainer.addChild(_oIcon);

        // Icon mask (keeps icon inside its rounded frame)
        _oIconMask = new createjs.Shape();
        _oIconMask.graphics
            .beginFill('rgba(0,0,0,0.01)')
            .drawRoundRect(
                _oIcon.x - 65,
                _oIcon.y - 65,
                130, 130, 12
            );
        _oContainer.addChild(_oIconMask);
        _oIcon.mask = _oIconMask;

        // ===== PROGRESS BAR — sits below subtitle =====
        var oSprite = s_oSpriteLibrary.getSprite('progress_bar');

        _oProgressBar = createBitmap(oSprite);
        _oProgressBar.x = CANVAS_WIDTH / 2 - (oSprite.width / 2);
        _oProgressBar.y = CANVAS_HEIGHT / 2 + 20;

        _oContainer.addChild(_oProgressBar);

        _iMaskWidth = oSprite.width;
        _iMaskHeight = oSprite.height;

        _oMaskPreloader = new createjs.Shape();
        _oMaskPreloader.graphics
            .beginFill("rgba(0,0,0,0.01)")
            .drawRect(
                _oProgressBar.x,
                _oProgressBar.y,
                1,
                _iMaskHeight
            );

        _oContainer.addChild(_oMaskPreloader);

        _oProgressBar.mask = _oMaskPreloader;


        // ===== TITLE TEXT =====
        var oTitle = new createjs.Text('PENALTY KICK', 'bold 52px ' + FONT_GAME, '#FFD700');
        oTitle.textAlign = 'center';
        oTitle.x = CANVAS_WIDTH / 2;
        oTitle.y = CANVAS_HEIGHT / 2 - 55;
        oTitle.shadow = new createjs.Shadow('#FFD700', 0, 0, 1);
        oTitle.letterSpacing = 12;
        _oContainer.addChild(oTitle);

        var oSubtitle = new createjs.Text('MULTIPLAYER CHALLENGE', '14px ' + FONT_GAME, 'rgba(120, 120, 120, 0.80)');
        oSubtitle.textAlign = 'center';
        oSubtitle.x = CANVAS_WIDTH / 2;
        oSubtitle.y = CANVAS_HEIGHT / 2;
        oSubtitle.letterSpacing = 12;
        _oContainer.addChild(oSubtitle);

        // ===== LOADING TEXT =====
        _oLoadingText = new createjs.Text(
            "",
            "20px " + FONT_GAME,
            "rgba(255,255,255,0.55)"
        );

        _oLoadingText.x = CANVAS_WIDTH / 2;
        _oLoadingText.y = CANVAS_HEIGHT / 2 + 76;
        _oLoadingText.textBaseline = "alphabetic";
        _oLoadingText.textAlign = "center";

        _oContainer.addChild(_oLoadingText);

        // ===== FADE =====
        _oFade = new createjs.Shape();
        _oFade.graphics
            .beginFill("black")
            .drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        _oContainer.addChild(_oFade);

        createjs.Tween.get(_oFade)
            .to({ alpha: 0 }, 500)
            .call(function () {

                createjs.Tween.removeTweens(_oFade);
                _oContainer.removeChild(_oFade);

            });

    };


    this.refreshLoader = function (iPerc) {
        _oLoadingText.text = iPerc + "%";

        if (iPerc === 100) {
            s_oMain._onRemovePreloader();
            _oLoadingText.visible = false;
            _oProgressBar.visible = false;
        };

        _oMaskPreloader.graphics.clear();
        var iNewMaskWidth = Math.floor((iPerc * _iMaskWidth) / 100);
        _oMaskPreloader.graphics.beginFill("rgba(0,0,0,0.01)").drawRect(_oProgressBar.x, _oProgressBar.y, iNewMaskWidth, _iMaskHeight);
    };

    this._init();
}