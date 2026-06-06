// ─── CAvatarManager.js ────────────────────────────────────────────────────────
// Centralized avatar manager singleton.
// Handles preloading, caching, session state, path resolution,
// and HTML/DOM rendering for player avatar images.
// ─────────────────────────────────────────────────────────────────────────────

var CAvatarManager = (function () {

    // ── Config ────────────────────────────────────────────────────────────────
    var AVATAR_BASE_PATH = 'sprites/Avatars/';
    var DEFAULT_AVATAR   = 'default.png';

    // All available avatar filenames (must match files in sprites/Avatars/)
    var AVAILABLE_AVATARS = [
        '1.png',
        '4.png',
        '5.png',
        '6.png',
        '7.png',
        '8.png',
        '9.png',
        '10.png',
        '11.png',
        '16.png'
    ];

    // ── State ─────────────────────────────────────────────────────────────────
    var _cache       = {};   // filename → Image object
    var _preloaded   = false;
    var _myAvatar    = null; // filename (e.g. 'Argentina1.png')
    var _oppAvatar   = null; // filename

    // ── Preload ───────────────────────────────────────────────────────────────
    // Preloads all avatar images + default into cache.
    // Call early (e.g. on page load or mode select init).
    function preloadAll(onComplete) {
        var toLoad = [DEFAULT_AVATAR].concat(AVAILABLE_AVATARS);
        var loaded = 0;
        var total  = toLoad.length;

        for (var i = 0; i < toLoad.length; i++) {
            (function (filename) {
                if (_cache[filename]) {
                    loaded++;
                    if (loaded >= total) {
                        _preloaded = true;
                        if (onComplete) onComplete();
                    }
                    return;
                }
                var img = new Image();
                img.onload = function () {
                    _cache[filename] = img;
                    loaded++;
                    if (loaded >= total) {
                        _preloaded = true;
                        if (onComplete) onComplete();
                    }
                };
                img.onerror = function () {
                    console.warn('[CAvatarManager] Failed to preload: ' + filename);
                    loaded++;
                    if (loaded >= total) {
                        _preloaded = true;
                        if (onComplete) onComplete();
                    }
                };
                img.src = AVATAR_BASE_PATH + filename;
            })(toLoad[i]);
        }
    }

    // ── Validation helper ──
    function isValidAvatarFilename(filename) {
        if (typeof filename !== 'string') return false;
        
        // If it matches any of the AVAILABLE_AVATARS, it's valid
        if (AVAILABLE_AVATARS.indexOf(filename) !== -1) return true;
        if (filename === DEFAULT_AVATAR) return true;

        // Check if it has a valid image extension or looks like a URL/path
        var hasExtension = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filename);
        var isUrlOrPath = filename.indexOf('/') !== -1 || filename.indexOf('http') === 0;

        // Check for emoji or non-standard characters
        var hasEmoji = /[\uD800-\uDFFF\u2600-\u27BF]/.test(filename);

        return (hasExtension || isUrlOrPath) && !hasEmoji;
    }

    // ── Path Resolution ───────────────────────────────────────────────────────
    function getAvatarPath(filename) {
        if (!filename || !isValidAvatarFilename(filename)) return AVATAR_BASE_PATH + DEFAULT_AVATAR;
        // If it already contains the base path, return as-is
        if (filename.indexOf(AVATAR_BASE_PATH) === 0) return filename;
        // If it's a full URL, return as-is
        if (filename.indexOf('http') === 0) return filename;
        return AVATAR_BASE_PATH + filename;
    }

    function getDefaultPath() {
        return AVATAR_BASE_PATH + DEFAULT_AVATAR;
    }

    // ── Random Avatar Assignment ──────────────────────────────────────────────
    function getRandomAvatar() {
        var idx = Math.floor(Math.random() * AVAILABLE_AVATARS.length);
        return AVAILABLE_AVATARS[idx];
    }

    // ── ID to Filename Mapping ──
    var ID_TO_FILENAME = {
        1: '1.png',
        4: '4.png',
        5: '5.png',
        6: '6.png',
        7: '7.png',
        8: '8.png',
        9: '9.png',
        10: '10.png',
        11: '11.png',
        16: '16.png'
    };

    function parseAvatarInput(input) {
        if (!input) return null;

        // 1. If it is an object
        if (typeof input === 'object') {
            if (input.id !== undefined && input.id !== null && ID_TO_FILENAME[input.id]) {
                return ID_TO_FILENAME[input.id];
            }
            if (input.avatar !== undefined && input.avatar !== null) {
                var av = input.avatar;
                if (av && typeof av === 'object' && av.id !== undefined && av.id !== null && ID_TO_FILENAME[av.id]) {
                    return ID_TO_FILENAME[av.id];
                }
                if (av && ID_TO_FILENAME[av]) {
                    return ID_TO_FILENAME[av];
                }
            }
            if (typeof input.avatar_key === 'string') {
                var parts = input.avatar_key.split('/');
                var lastPart = parts[parts.length - 1];
                if (AVAILABLE_AVATARS.indexOf(lastPart) !== -1) {
                    return lastPart;
                }
            }
            return null;
        }

        // 2. If it is a raw number or numeric string (like 5 or "5")
        var num = Number(input);
        if (!isNaN(num) && ID_TO_FILENAME[num]) {
            return ID_TO_FILENAME[num];
        }

        // 3. If it is a standard string filename
        if (typeof input === 'string') {
            var parts = input.split('/');
            var lastPart = parts[parts.length - 1];
            if (AVAILABLE_AVATARS.indexOf(lastPart) !== -1) {
                return lastPart;
            }
            if (AVAILABLE_AVATARS.indexOf(input) !== -1) {
                return input;
            }
        }

        return null;
    }

    // ── Session State ─────────────────────────────────────────────────────────
    function setMyAvatar(filename) {
        var originalInput = filename;
        filename = parseAvatarInput(filename);
        if (filename && !isValidAvatarFilename(filename)) {
            filename = null;
        }
        _myAvatar = filename || _myAvatar || getRandomAvatar();
        console.log('[CAvatarManager] setMyAvatar: input =', originalInput, '-> resolved =', filename, '-> final myAvatar =', _myAvatar);
    }

    function setOppAvatar(filename) {
        var originalInput = filename;
        filename = parseAvatarInput(filename);
        if (filename && !isValidAvatarFilename(filename)) {
            filename = null;
        }

        var isBotMode = (typeof s_oMultiplayer !== 'undefined' && s_oMultiplayer.getMode && s_oMultiplayer.getMode() === 'bot');
        if (isBotMode) {
            // Only assign a new random avatar if we don't have one set yet
            if (!_oppAvatar || _oppAvatar === DEFAULT_AVATAR) {
                var playerAvatar = getMyAvatar();
                var allowedAvatars = AVAILABLE_AVATARS.filter(function(av) {
                    return av !== playerAvatar;
                });
                if (allowedAvatars.length > 0) {
                    var idx = Math.floor(Math.random() * allowedAvatars.length);
                    _oppAvatar = allowedAvatars[idx];
                } else {
                    _oppAvatar = DEFAULT_AVATAR;
                }
            }
        } else {
            _oppAvatar = filename || _oppAvatar || DEFAULT_AVATAR;
        }
        console.log('[CAvatarManager] setOppAvatar: input =', originalInput, '-> resolved =', filename, '-> final oppAvatar =', _oppAvatar);
    }

    function resetOppAvatar() {
        _oppAvatar = null;
        console.log('[CAvatarManager] Opponent avatar reset');
    }

    function getMyAvatar() {
        return _myAvatar || getRandomAvatar();
    }

    function getOppAvatar() {
        return _oppAvatar || DEFAULT_AVATAR;
    }

    function getMyAvatarPath() {
        return getAvatarPath(getMyAvatar());
    }

    function getOppAvatarPath() {
        return getAvatarPath(getOppAvatar());
    }

    // ── Cached Image Retrieval ────────────────────────────────────────────────
    function getCachedImage(filename) {
        return _cache[filename] || null;
    }

    // ── HTML Rendering ────────────────────────────────────────────────────────
    // Returns an <img> HTML string with circular styling and onerror fallback.
    function renderAvatarImg(path, cssClass, size) {
        var cls  = cssClass || 'player-avatar';
        var sz   = size ? ('width:' + size + 'px;height:' + size + 'px;') : '';
        var def  = getDefaultPath();
        return '<img src="' + path + '" ' +
               'class="' + cls + '" ' +
               'style="' + sz + '" ' +
               'onerror="this.onerror=null;this.src=\'' + def + '\';" ' +
               'draggable="false" ' +
               'alt="Player Avatar">';
    }

    // Returns a DOM <img> element ready to append.
    function createAvatarElement(path, size, cssClass) {
        var img   = document.createElement('img');
        img.src   = path;
        img.className = cssClass || 'player-avatar';
        img.draggable = false;
        img.alt   = 'Player Avatar';
        if (size) {
            img.style.width  = size + 'px';
            img.style.height = size + 'px';
        }
        var def = getDefaultPath();
        img.onerror = function () {
            this.onerror = null;
            this.src = def;
        };
        return img;
    }

    // ── Expose ────────────────────────────────────────────────────────────────
    return {
        preloadAll        : preloadAll,
        getAvatarPath     : getAvatarPath,
        getDefaultPath    : getDefaultPath,
        getRandomAvatar   : getRandomAvatar,
        setMyAvatar       : setMyAvatar,
        setOppAvatar      : setOppAvatar,
        resetOppAvatar    : resetOppAvatar,
        getMyAvatar       : getMyAvatar,
        getOppAvatar      : getOppAvatar,
        getMyAvatarPath   : getMyAvatarPath,
        getOppAvatarPath  : getOppAvatarPath,
        getCachedImage    : getCachedImage,
        renderAvatarImg   : renderAvatarImg,
        createAvatarElement: createAvatarElement,
        AVATAR_BASE_PATH  : AVATAR_BASE_PATH,
        DEFAULT_AVATAR    : DEFAULT_AVATAR,
        AVAILABLE_AVATARS : AVAILABLE_AVATARS
    };

})();
