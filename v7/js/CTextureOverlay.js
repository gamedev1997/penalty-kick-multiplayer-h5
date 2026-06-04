// ─────────────────────────────────────────────────────────────────────────────
// CTextureOverlay.js
// Full-canvas texture overlay system for cinematic visual polish.
//
// Modes:
//   'stretch'  – single texture stretched to fill CANVAS_WIDTH × CANVAS_HEIGHT
//   'tile'     – texture repeated across the full canvas
//
// Composite (blend) modes  (maps to canvas globalCompositeOperation):
//   'overlay', 'multiply', 'screen', 'lighter' (additive),
//   'source-over' (normal), 'soft-light', 'color-dodge', etc.
//
// Usage:
//   var overlay = new CTextureOverlay(oParentContainer, {
//       mode      : 'stretch',        // 'stretch' | 'tile'
//       alpha     : 0.08,             // 0–1
//       composite : 'overlay',        // any valid globalCompositeOperation
//       zOrder    : 'behind',         // 'behind' | 'front'
//       texture   : 'vignette'        // built-in preset name or an Image/Canvas
//   });
//
// Built-in procedural presets:
//   'vignette'      – soft dark edge vignette (cinematic)
//   'filmGrain'     – fine noise grain (film look)
//   'lightSweep'    – diagonal warm light band
//   'stadiumGlow'   – radial green-tinted stadium ambiance
//   'dust'          – sparse bright dust particles
// ─────────────────────────────────────────────────────────────────────────────

function CTextureOverlay(oParentContainer, oConfig) {

    var _oContainer   = oParentContainer;
    var _oDisplayObj   = null;   // createjs.Bitmap or createjs.Shape

    // Defaults
    var _szMode       = 'stretch';          // 'stretch' | 'tile'
    var _fAlpha        = 0.08;
    var _szComposite   = 'overlay';         // globalCompositeOperation
    var _szZOrder      = 'behind';          // 'behind' | 'front'
    var _oTexture      = null;              // Image | Canvas | preset-string
    var _bVisible      = true;

    // =====================================================================
    // PROCEDURAL TEXTURE GENERATORS
    // =====================================================================

    var _generators = {

        // ── Cinematic vignette ──────────────────────────────────────────
        vignette: function () {
            var c = _makeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            var ctx = c.getContext('2d');
            var cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2;
            var r = Math.max(cx, cy) * 1.15;
            var grad = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.55, 'rgba(0,0,0,0)');
            grad.addColorStop(0.85, 'rgba(0,0,0,0.35)');
            grad.addColorStop(1, 'rgba(0,0,0,0.7)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            return c;
        },

        // ── Film grain (noise) ──────────────────────────────────────────
        filmGrain: function () {
            // Small tile that will be repeated
            var sz = 128;
            var c = _makeCanvas(sz, sz);
            var ctx = c.getContext('2d');
            var imgData = ctx.createImageData(sz, sz);
            var d = imgData.data;
            for (var i = 0; i < d.length; i += 4) {
                var v = Math.random() * 255 | 0;
                d[i] = d[i + 1] = d[i + 2] = v;
                d[i + 3] = 25; // very subtle
            }
            ctx.putImageData(imgData, 0, 0);
            return c;
        },

        // ── Diagonal warm light sweep ───────────────────────────────────
        lightSweep: function () {
            var c = _makeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            var ctx = c.getContext('2d');
            var grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.6);
            grad.addColorStop(0, 'rgba(255,220,150,0)');
            grad.addColorStop(0.35, 'rgba(255,220,150,0.10)');
            grad.addColorStop(0.5, 'rgba(255,240,200,0.22)');
            grad.addColorStop(0.65, 'rgba(255,220,150,0.10)');
            grad.addColorStop(1, 'rgba(255,220,150,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            return c;
        },

        // ── Stadium green-tinted radial glow ────────────────────────────
        stadiumGlow: function () {
            var c = _makeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            var ctx = c.getContext('2d');
            var cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT * 0.35;
            var r = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.75;
            var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, 'rgba(120,220,90,0.12)');
            grad.addColorStop(0.4, 'rgba(80,180,60,0.06)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            return c;
        },

        // ── Sparse dust particles ───────────────────────────────────────
        dust: function () {
            var c = _makeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            var ctx = c.getContext('2d');
            var count = 80;
            for (var i = 0; i < count; i++) {
                var x = Math.random() * CANVAS_WIDTH;
                var y = Math.random() * CANVAS_HEIGHT;
                var r = 0.5 + Math.random() * 1.5;
                var a = 0.15 + Math.random() * 0.35;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,240,' + a + ')';
                ctx.fill();
            }
            return c;
        }
    };

    // =====================================================================
    // HELPERS
    // =====================================================================

    function _makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width  = w;
        c.height = h;
        return c;
    }

    function _resolveTexture(tex) {
        if (!tex) return _generators.vignette();
        if (typeof tex === 'string' && _generators[tex]) {
            return _generators[tex]();
        }
        // User-supplied Image or Canvas
        if (tex instanceof HTMLImageElement || tex instanceof HTMLCanvasElement) {
            return tex;
        }
        // Fallback
        return _generators.vignette();
    }

    // =====================================================================
    // BUILD
    // =====================================================================

    this._init = function () {
        // Parse config
        if (oConfig) {
            if (oConfig.mode)      _szMode      = oConfig.mode;
            if (oConfig.alpha !== undefined) _fAlpha = oConfig.alpha;
            if (oConfig.composite) _szComposite  = oConfig.composite;
            if (oConfig.zOrder)    _szZOrder     = oConfig.zOrder;
            if (oConfig.texture !== undefined) _oTexture = oConfig.texture;
            if (oConfig.visible !== undefined) _bVisible = oConfig.visible;
        }

        var oSourceCanvas = _resolveTexture(_oTexture);

        if (_szMode === 'tile') {
            // Build a full-canvas tiled canvas from the small texture tile
            var fullCanvas = _makeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            var fCtx = fullCanvas.getContext('2d');
            var pat = fCtx.createPattern(oSourceCanvas, 'repeat');
            fCtx.fillStyle = pat;
            fCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            oSourceCanvas = fullCanvas;
        }

        // Create EaselJS bitmap
        _oDisplayObj = new createjs.Bitmap(oSourceCanvas);
        _oDisplayObj.alpha = _fAlpha;
        _oDisplayObj.compositeOperation = _szComposite;
        _oDisplayObj.mouseEnabled = false;
        _oDisplayObj.tickEnabled  = false;
        _oDisplayObj.visible = _bVisible;

        // Cache for performance (static texture, drawn once)
        _oDisplayObj.cache(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Insert into container at the correct z-position
        if (_szZOrder === 'front') {
            _oContainer.addChild(_oDisplayObj);
        } else {
            // 'behind' — add right above the background (index 1)
            // Index 0 is the bg bitmap; insert at 1 so it sits on top of bg
            // but below all gameplay sprites.
            var idx = Math.min(1, _oContainer.children.length);
            _oContainer.addChildAt(_oDisplayObj, idx);
        }
    };

    // =====================================================================
    // PUBLIC API
    // =====================================================================

    /** Change opacity at runtime (0–1). */
    this.setAlpha = function (f) {
        _fAlpha = f;
        if (_oDisplayObj) _oDisplayObj.alpha = _fAlpha;
    };

    /** Get current alpha. */
    this.getAlpha = function () {
        return _fAlpha;
    };

    /** Change blend/composite mode at runtime. */
    this.setComposite = function (sz) {
        _szComposite = sz;
        if (_oDisplayObj) _oDisplayObj.compositeOperation = _szComposite;
    };

    /** Show / hide. */
    this.setVisible = function (b) {
        _bVisible = b;
        if (_oDisplayObj) _oDisplayObj.visible = _bVisible;
    };

    /** Swap texture at runtime (preset name or Image/Canvas). */
    this.setTexture = function (tex, szMode) {
        if (szMode) _szMode = szMode;
        // Remove old
        if (_oDisplayObj && _oContainer) {
            _oContainer.removeChild(_oDisplayObj);
        }
        _oTexture = tex;
        this._init();
    };

    /** Move to front of container. */
    this.bringToFront = function () {
        if (_oDisplayObj && _oContainer) {
            _oContainer.removeChild(_oDisplayObj);
            _oContainer.addChild(_oDisplayObj);
        }
    };

    /** Move behind all gameplay sprites (index 1, right above bg). */
    this.sendToBack = function () {
        if (_oDisplayObj && _oContainer) {
            _oContainer.removeChild(_oDisplayObj);
            var idx = Math.min(1, _oContainer.children.length);
            _oContainer.addChildAt(_oDisplayObj, idx);
        }
    };

    /** Clean up. */
    this.unload = function () {
        if (_oDisplayObj && _oContainer) {
            _oContainer.removeChild(_oDisplayObj);
        }
        _oDisplayObj = null;
    };

    // =====================================================================
    // INIT
    // =====================================================================
    this._init();

    return this;
}

// Expose globally
window.CTextureOverlay = CTextureOverlay;
