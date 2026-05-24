function CGame(oData, gameStartData) {

    var _oInterface;
    var _oBg;

    var _oScene;
    var _oBall;
    var _oStartBall;
    var _oGoalKeeper = null;
    var _oContainerGame;
    var _oClickPoint;
    var _oReleasePoint;
    var _oHitArea;
    var _oPlayer;
    var _oFieldCollision = null;
    var _oHandSwipeAnim;
    var _oGoal;
    var _bGoal = false;
    var _bLaunched = false;
    var _bBallOut = false;
    var _bFieldCollide = false;
    var _bAnimPlayer = false;
    var _bAnimGoalKeeper = false;
    var _bSaved = false;
    var _bMakeGoal = false;
    var _bPoleCollide = false;
    var _bGkIntercepted = false;    // true after virtual GK body collision fires
    var _fGkImpactX = 0;            // actual ball X at impact (used by deflection)
    var _iLevel = 1;
    var _iScore;
    var _iArea;
    var _iLaunch = 0;
    var _iCombo = 0;
    var _iTimePressDown = 0;
    var _fTimeReset;
    var _fTimePoleReset;
    var _fTimeSwipe;
    var _fMultiplier;
    var _aObjects;
    var _vHitDir;
    this._pGoalSize;

    var _iGameState = STATE_INIT;
    var _oCamera = null;

    // ——————————————————————————————————————————————————————————————————————————————
    var _bMultiplayerMode = false;
    var _bIsMyTurn = false;
    var _iTurnTimer = 0;
    var _iTimerInterval = null;
    var _iTimeLeft = 15;
    var _sCurrentTurn = "p1";
    var _sMyPlayerId = null;
    var _bGameOver = false;
    var _bOpponentAnimating = false;
    var _iP1Score = 0;
    var _iP2Score = 0;
    var _iP1Shots = 0;
    var _iP2Shots = 0;
    var _oMpHUD = null;
    var _oMpScoreText = null;
    var _oShotsText = null;
    var _oTurnText = null;
    var _oTimerText = null;
    var _iOppTimerInterval = null;
    var _bOppTimedOut = false;   // set when local opp countdown reaches 0
    var _bHelpTextHidden = false;
    var _sMpMyName = 'You';
    var _sMpOppName = 'Opp';
    var _iPrecomputedGkAnim = -1;
    var _bMpResultReceived = false;
    var _bIsMiss = false; // true if current round result is a miss
    var _bReplayingKick = false;
    var _fGkFadeDelay = 0;          // ms to hold GK visible after dive anim ends
    var _bMpGkAnimPlayed = false;   // true once GK dive anim has been triggered this round
    var _bMpSaveFired    = false;   // true once _mpSaveBall has run this round (idempotency)
    var _bTimeoutTriggered = false; // true if current round timed out
    var _iMpSaveTimer    = null;    // handle for the save setTimeout (so we can cancel it)
    var _bSwipeHintShown = false;   // tracks if swipe animation was played this round

    var _getBallFlightTime = function (hitDirY, targetY) {
        var POSITION_BALL_Y = 15.4;
        var BALL_MASS = 0.5;
        var BALL_LINEAR_DAMPING = 0.2;
        
        var fps = s_bMobile ? 30 : 60;
        var stepRate = 1.5;
        var physicsStep = 1 / (fps * stepRate);
        var physicsAccuracy = 3;
        
        var positionY = POSITION_BALL_Y;
        var velocityY = hitDirY / BALL_MASS;
        
        var frameTime = 0;
        var frameDuration = 1 / fps;
        var steps = 0;
        
        while (positionY < targetY && steps < 1000) {
            steps++;
            for (var i = 0; i < physicsAccuracy; i++) {
                velocityY *= Math.pow(1 - BALL_LINEAR_DAMPING, physicsStep);
                positionY += velocityY * physicsStep;
            }
            frameTime += frameDuration;
        }
        return frameTime * 1000; // in milliseconds
    };

    this._checkGkVisualOverlap = function () {
        this.ballPosition(); // sync 2D ball position with physics body

        var iAnimType = _oGoalKeeper.getAnimType();
        var gkX = _oGoalKeeper.getX();
        var gkY = _oGoalKeeper.getY();
        var ballX = _oBall.getX();
        var ballY = _oBall.getY();

        if (iAnimType === IDLE) {
            // Standing body block
            var dx = ballX - gkX;
            var dy = ballY - gkY;
            return (Math.abs(dx) < 70 && Math.abs(dy) < 130);
        }

        var pOriginImpact = ORIGIN_POINT_IMPACT_ANIMATION[iAnimType];
        if (!pOriginImpact) {
            return false;
        }

        // 1. Hand Position Calibration
        var hX = (pOriginImpact.x !== null) ? pOriginImpact.x : 0;
        var hY = 0;
        if (pOriginImpact.y !== null) {
            hY = pOriginImpact.y;
        } else {
            // Calibrate hand Y offset relative to container center based on active animation
            switch (iAnimType) {
                case CENTER_DOWN:     hY = 80; break;     // Low center dive
                case CENTER_UP:       hY = -95; break;    // High center catch
                case LEFT_DOWN:
                case RIGHT_DOWN:      hY = 80; break;     // Low corner slide
                case CENTER:          hY = -20; break;    // Chest catch
                case SIDE_LEFT:
                case SIDE_RIGHT:      hY = -30; break;    // Mid dive
                case SIDE_LEFT_UP:
                case SIDE_RIGHT_UP:   hY = -85; break;    // High corner parry
                case SIDE_LEFT_DOWN:
                case SIDE_RIGHT_DOWN: hY = 65; break;     // Low parry
                default:              hY = 0; break;
            }
        }
        
        var handX = gkX + hX;
        var handY = gkY + hY;

        var dxHand = ballX - handX;
        var dyHand = ballY - handY;
        var distHand = Math.sqrt(dxHand * dxHand + dyHand * dyHand);

        // 2. Body Hitbox Calibration based on Goalkeeper Orientation
        var dxBody = ballX - gkX;
        var dyBody = ballY - gkY;

        var bHandTouch = (distHand < 55); // 55 pixels glove contact radius
        var bBodyTouch = false;

        // Check orientation of the dive
        var bHorizontalDive = (
            iAnimType === RIGHT || iAnimType === LEFT ||
            iAnimType === LEFT_DOWN || iAnimType === RIGHT_DOWN ||
            iAnimType === SIDE_LEFT || iAnimType === SIDE_RIGHT ||
            iAnimType === SIDE_LEFT_UP || iAnimType === SIDE_RIGHT_UP ||
            iAnimType === SIDE_LEFT_DOWN || iAnimType === SIDE_RIGHT_DOWN ||
            iAnimType === LEFT_UP || iAnimType === RIGHT_UP
        );

        if (bHorizontalDive) {
            // Horizontal layout (wide and flat)
            bBodyTouch = (Math.abs(dxBody) < 130 && Math.abs(dyBody) < 65);
        } else {
            // Vertical layout (narrow and tall)
            bBodyTouch = (Math.abs(dxBody) < 70 && Math.abs(dyBody) < 120);
        }

        return bHandTouch || bBodyTouch;
    };

    this._applyGkPhysicsDeflection = function (oBallBody) {
        var iAnimType = _oGoalKeeper.getAnimType();
        var gkX = _oGoalKeeper.getX();
        var gkY = _oGoalKeeper.getY();
        var ballX = _oBall.getX();
        var ballY = _oBall.getY();

        var pOriginImpact = ORIGIN_POINT_IMPACT_ANIMATION[iAnimType];
        var hX = (pOriginImpact && pOriginImpact.x !== null) ? pOriginImpact.x : 0;
        var hY = (pOriginImpact && pOriginImpact.y !== null) ? pOriginImpact.y : 0;
        
        var handX = gkX + hX;
        var handY = gkY + hY;

        var fVx = oBallBody.velocity.x;
        var fVy = Math.abs(oBallBody.velocity.y);

        var dx = ballX - handX;
        var dy = ballY - handY;

        // Elastic rebound physics
        var fDeflX = fVx * (-0.15) + (dx * 0.065);
        var fDeflY = -(fVy * 0.45 + 4.0);
        var fDeflZ = -dy * 0.08 + 2.0 + (Math.random() - 0.5) * 1.5;

        fDeflX = Math.max(-18, Math.min(18, fDeflX));
        fDeflY = Math.max(-35, Math.min(-3, fDeflY));
        fDeflZ = Math.max(0.5, Math.min(11, fDeflZ));

        _oScene.setElementVelocity(oBallBody, { x: fDeflX, y: fDeflY, z: fDeflZ });
        _oScene.setElementAngularVelocity(oBallBody, {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            z: (Math.random() - 0.5) * 5
        });
    };

    this._init = function () {
        $(s_oMain).trigger("start_session");
        this.pause(true);
        $(s_oMain).trigger("start_level", _iLevel);
        _iScore = 0;

        _fMultiplier = 1;

        _aObjects = new Array();

        _oContainerGame = new createjs.Container();
        s_oStage.addChild(_oContainerGame);

        _oBg = createBitmap(s_oSpriteLibrary.getSprite("bg_game"));
        _oBg.cache(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        _oContainerGame.addChild(_oBg);

        _oScene = new CScenario(_iLevel);

        if (SHOW_3D_RENDER) {
            _oCamera = camera;
        } else {
            _oCamera = createOrthoGraphicCamera();
        }

        var iSidePostWidth = 15;
        var iTopPostHeight = 15;
        var oSprite = s_oSpriteLibrary.getSprite("goal");
        _pGoalSize = { w: oSprite.width - iSidePostWidth, h: oSprite.height - iTopPostHeight / 2 };
        _oGoal = new CGoal(291, 28, oSprite, _oContainerGame);

        // Draw 2D Goal Sensor Area for debugging/visibility
        var oGoalAreaDebug = new createjs.Shape();
        var ptBL = this.convert3dPosTo2dScreen({ x: -20.25, y: 132, z: -9 }, _oCamera);
        var ptBR = this.convert3dPosTo2dScreen({ x: 20.25, y: 132, z: -9 }, _oCamera);
        var ptTR = this.convert3dPosTo2dScreen({ x: 20.25, y: 132, z: 4.8 }, _oCamera);
        var ptTL = this.convert3dPosTo2dScreen({ x: -20.25, y: 132, z: 4.8 }, _oCamera);

        oGoalAreaDebug.graphics.beginFill("rgba(255, 0, 0, 0.25)")
                               .beginStroke("#ff0000")
                               .setStrokeStyle(3)
                               .moveTo(ptBL.x, ptBL.y)
                               .lineTo(ptBR.x, ptBR.y)
                               .lineTo(ptTR.x, ptTR.y)
                               .lineTo(ptTL.x, ptTL.y)
                               .closePath();
        oGoalAreaDebug.visible = SHOW_AREAS_GOAL;
        _oContainerGame.addChild(oGoalAreaDebug);


        _oGoalKeeper = new CGoalKeeper(CANVAS_WIDTH_HALF - 100, CANVAS_HEIGHT_HALF - 225, _oContainerGame);
        _aObjects.push(_oGoalKeeper);

        var oSpriteBall = s_oSpriteLibrary.getSprite("ball");
        _oBall = new CBall(0, 0, oSpriteBall, _oScene.ballBody(), _oContainerGame);
        _aObjects.push(_oBall);

        this.ballPosition();

        _oBall.setVisible(false);

        _fTimeSwipe = MS_TIME_SWIPE_START;

        _oStartBall = new CStartBall(CANVAS_WIDTH_HALF + 55, CANVAS_HEIGHT_HALF + 168, _oContainerGame);

        _oPlayer = new CPlayer(CANVAS_WIDTH_HALF - 150, CANVAS_HEIGHT_HALF - 320, _oContainerGame);
        _oPlayer.setVisible(false);

        var szImage = "cursor";
        if (s_bMobile) {
            szImage = "hand_touch";
            TIME_SWIPE = 650;
        } else {
            TIME_SWIPE = 500;
        }

        _oHandSwipeAnim = new CHandSwipeAnim(START_HAND_SWIPE_POS, END_HAND_SWIPE_POS, s_oSpriteLibrary.getSprite(szImage), s_oStage);
        _oHandSwipeAnim.animAllSwipe();

        resizeCanvas3D();

        setVolume("soundtrack", SOUNDTRACK_VOLUME_IN_GAME);

        // Immediately enable multiplayer mode if there is match data
        _bMultiplayerMode = !!gameStartData;

        _oInterface = new CInterface();
        _oInterface._init(!!gameStartData);   // hide swipe text initially in multiplayer
        _oInterface.refreshTextScoreBoard(0, 0, 0, false);
        _oInterface.refreshLaunchBoard(_iLaunch, NUM_OF_PENALTY);

        _vHitDir = new CANNON.Vec3(0, 0, 0);

        this.onExitHelp();

        // â”€â”€ Multiplayer init (if match data provided) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (gameStartData && gameStartData.myPlayerId !== undefined) {
            var _self = this;
            setTimeout(function () { _self.initMultiplayer(gameStartData); }, 50);
        }
    };

    this.createControl = function () {
        if (!SHOW_3D_RENDER) {
            _oHitArea = new createjs.Shape();
            _oHitArea.graphics.beginFill("rgba(255,0,0,0.01)").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            _oContainerGame.addChild(_oHitArea);

            _oHitArea.on('mousedown', this.onMouseDown);
            _oHitArea.on('pressmove', this.onPressMove);
            _oHitArea.on('pressup', this.onPressUp);
        } else {
            window.addEventListener('mousedown', this.onMouseDown);
            window.addEventListener('mousemove', this.onPressMove);
            window.addEventListener('mouseup', this.onPressUp);
        }
    };

    this.sortDepth = function (oObj1, oObj2) {
        if (oObj1.getDepthPos() > oObj2.getDepthPos()) {
            if (_oContainerGame.getChildIndex(oObj1.getObject()) > _oContainerGame.getChildIndex(oObj2.getObject())) {
                _oContainerGame.swapChildren(oObj1.getObject(), oObj2.getObject());
            }
        } else if (oObj1.getDepthPos() < oObj2.getDepthPos()) {
            if (_oContainerGame.getChildIndex(oObj2.getObject()) > _oContainerGame.getChildIndex(oObj1.getObject())) {
                _oContainerGame.swapChildren(oObj2.getObject(), oObj1.getObject());
            }
        }
    };

    this.onExitHelp = function () {
        this.createControl();
        this.pause(false);

        if (!_bMultiplayerMode) {
            if (_oInterface && typeof _oInterface.showTurnMessage === 'function') {
                _oInterface.showTurnMessage(true, true);
            }
            if (_oStartBall && typeof _oStartBall.showGlow === 'function') {
                _oStartBall.showGlow(true);
            }
        }
    };

    this.poleCollide = function () {
        _fTimePoleReset = TIME_POLE_COLLISION_RESET;
        _bPoleCollide = true;
        playSound("pole", 0.4, false);
    };

    this.fieldCollision = function () {
        if (_oFieldCollision === null && _bLaunched) {
            _oFieldCollision = playSound("drop_bounce_grass", 0.3, false);
            if (_oFieldCollision !== null) {
                _oFieldCollision.on('end', function () {
                    _oFieldCollision = null;
                });
            }
        }
    };

    this.ballPosition = function () {
        var oBallBody = _oScene.ballBody();

        var oPos2DBall = this.convert3dPosTo2dScreen(oBallBody.position, _oCamera);

        var fScaleDistance = oPos2DBall.z * (BALL_SCALE_FACTOR - _oBall.getStartScale()) + _oBall.getStartScale();

        _oBall.setPosition(oPos2DBall.x, oPos2DBall.y);
        _oBall.scale(fScaleDistance);

        this.refreshShadowCast(_oBall, oBallBody, fScaleDistance);
    };

    this.onMouseDown = function (e) {
        // Block input when it's not our turn in multiplayer, or if timeout has triggered
        if (_bMultiplayerMode && (!_bIsMyTurn || _bTimeoutTriggered)) { return; }

        if (_bLaunched) {
            return;
        }

        _fTimeSwipe = MS_TIME_SWIPE_START;

        _oHandSwipeAnim.removeTweens();
        _oHandSwipeAnim.setVisible(false);

        if (_oInterface && typeof _oInterface.showTurnMessage === 'function') {
            _oInterface.showTurnMessage(false);
        }
        if (_oStartBall && typeof _oStartBall.showGlow === 'function') {
            _oStartBall.showGlow(false);
        }

        var iXPos = e.stageX;
        var iYPos = e.stageY;
        if (SHOW_3D_RENDER) {
            iXPos = e.x;
            iYPos = e.y;
        }

        _oClickPoint = { x: iXPos / s_fInverseScaling, y: iYPos / s_fInverseScaling };
        _oReleasePoint = { x: iXPos / s_fInverseScaling, y: iYPos / s_fInverseScaling };
    };

    this.onPressMove = function (e) {
        var iXPos = e.stageX;
        var iYPos = e.stageY;
        if (SHOW_3D_RENDER) {
            iXPos = e.x;
            iYPos = e.y;
        }

        _oReleasePoint = { x: iXPos / s_fInverseScaling, y: iYPos / s_fInverseScaling }
        _iTimePressDown += s_iTimeElaps;
    };

    this.onPressUp = function () {
        if (_bMultiplayerMode && _bTimeoutTriggered) {
            return;
        }
        if (_bLaunched || _oReleasePoint === null) {
            return;
        } else if ((_oClickPoint.y < _oReleasePoint.y) || (_oReleasePoint.x === 0 && _oReleasePoint.y === 0)) {
            return;
        }
        var fDistance = Math.ceil(distanceV2(_oClickPoint, _oReleasePoint)) * FORCE_RATE;

        if (fDistance > FORCE_MAX) {
            fDistance = FORCE_MAX;
        }

        if (_iTimePressDown > TIME_SWIPE) {
            _iTimePressDown = 0;
            return;

        }

        var vHitDir2D = new CVector2(_oClickPoint.x - _oReleasePoint.x,
            _oClickPoint.y - _oReleasePoint.y);

        vHitDir2D.scalarProduct(fDistance);

        var fForceLength = vHitDir2D.length();

        if (fForceLength > HIT_BALL_MIN_FORCE) {
            if (fForceLength > HIT_BALL_MAX_FORCE) {
                vHitDir2D.normalize();
                vHitDir2D.scalarProduct(HIT_BALL_MAX_FORCE);
            }

            _bAnimPlayer = true;
            _oPlayer.setVisible(true);
            var fForceY = _iTimePressDown / 10;
            if (fForceY > MAX_FORCE_Y) {
                fForceY = MAX_FORCE_Y;
            } else if (fForceY < MIN_FORCE_Y) {
                fForceY = MIN_FORCE_Y;
            }

            _vHitDir.set(-vHitDir2D.getX() * FORCE_MULTIPLIER_AXIS.x, fForceY, vHitDir2D.getY() * FORCE_MULTIPLIER_AXIS.z);

            _bMakeGoal = s_oGame.goalProbability();

            // â”€â”€ Send kick to server in multiplayer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if (_bMultiplayerMode) {
                var sDir = (_vHitDir.x > 5) ? 'left' : (_vHitDir.x < -5 ? 'right' : 'center');
                s_oMultiplayer.sendKick({
                    direction: sDir,
                    angle: _vHitDir.x,
                    power: _vHitDir.y,
                    targetY: _vHitDir.z
                });
            }
            if (_oInterface) {
                if (_oInterface.fadeOutHelpText) {
                    _oInterface.fadeOutHelpText();
                }
                if (_oInterface.unloadHelpText) {
                    _oInterface.unloadHelpText();
                }
            }
            _bHelpTextHidden = true;
        }

        _oReleasePoint.x = 0;
        _oReleasePoint.y = 0;
    };

    this.refreshShadowCast = function (oObject, oBody, fScaleDistance) {
        var oFieldBody = _oScene.getFieldBody();

        if (oBody.position.z < oFieldBody.position.z) {
            oObject.scaleShadow(0);
            return;
        }

        var oPosShadow = { x: oBody.position.x, y: oBody.position.y, z: oFieldBody.position.z };

        var oPos2dShadow = this.convert3dPosTo2dScreen(oPosShadow, _oCamera);

        var fDistance = (oBody.position.z - BALL_RADIUS) * ((oFieldBody.position.z - SHADOWN_FACTOR) - oFieldBody.position.z) + oFieldBody.position.z;

        var fScaleHeight = fDistance * fScaleDistance;

        oObject.scaleShadow(fScaleHeight);

        if (fScaleHeight < 0) {
            return;
        }

        oObject.setAlphaByHeight(fDistance);

        oObject.setPositionShadow(oPos2dShadow.x, oPos2dShadow.y);
    };

    this.addScore = function (iScore, iScoreNoMult) {
        _iScore += iScore;
        _oInterface.refreshTextScoreBoard(_iScore, _fMultiplier.toFixed(1), iScoreNoMult, true);
    };

    this.getLevel = function () {
        return _iLevel;
    };

    this.unload = function () {
        s_oStage.removeAllChildren();
        _oInterface.unload();

        _oHitArea.removeAllEventListeners();

        _oScene.destroyWorld();
        _oScene = null;
    };

    this.resetValues = function () {
        _iScore = 0;
        _oInterface.refreshTextScoreBoard(0, 0, 0, false);
        _iLaunch = 0;
        _fMultiplier = 1;
        _oInterface.refreshLaunchBoard(_iLaunch, NUM_OF_PENALTY);
    };

    this.wallSoundCollision = function () {
        playSound("ball_collision", 1, false);
    };

    this.areaGoal = function () {
        // In multiplayer the server is fully authoritative for goal/save.
        // onMpRoundResult handles all result text/sound/state — skip physics trigger here.
        if (_bMultiplayerMode) { return; }

        if (!_bGoal && !_bSaved) {
            // The ball reached the goal sensor, so it is a GOAL!
            _bGoal = true;
            _fTimeReset = TIME_RESET_AFTER_GOAL;
            this.textGoal();
            this.calculateScore();
            playSound("goal", 1, false);
        }
    };

    this.goalKeeperSave = function () {
        _bSaved = true;
        _fTimeReset = TIME_RESET_AFTER_SAVE;
        _oInterface.createAnimText(TEXT_SAVED, 80, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
        playSound("ball_saved", 1, false);
        this.rejectBall();
        _fMultiplier = 1;
        _iCombo = 0;
    };

    this.rejectBall = function () {
        // If the virtual GK collision already applied deflection physics,
        // don't override the velocity — the physics are already set correctly.
        if (_bGkIntercepted) { return; }

        // Fallback deflection for the legacy goal-line sensor path (should rarely
        // fire with the virtual GK body check in place, but kept as safety net).
        var oBP = _oBall.getPhysics();
        var fVx = oBP.velocity.x;
        var fVy = Math.abs(oBP.velocity.y);
        var fVz = oBP.velocity.z;

        var fDeflX = this._getGkDeflectionX(fVx);
        var fDeflY = -(fVy * 0.38 + 4);
        var fDeflZ = Math.max(0, fVz * 0.1) + 2 + Math.random() * 3;
        fDeflY    = Math.max(-38, fDeflY);

        _oScene.setElementVelocity(oBP, { x: fDeflX, y: fDeflY, z: fDeflZ });
        _oScene.setElementAngularVelocity(oBP, {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8,
            z: (Math.random() - 0.5) * 4
        });
    };

    // ─── Virtual GK body collision ─────────────────────────────────────────
    // The physics goal-area sensors are at y ≈ 131 with collisionResponse=0
    // (they don't push the ball). lineGoalCollision→areaGoal→rejectBall fires
    // AFTER the ball crosses y=131, by which time the ball is visually PAST
    // the goalkeeper sprite. This virtual check intercepts at y=GK_INTERCEPT_Y
    // (before the sensor), stops the ball with real physics, and calls
    // goalKeeperSave() directly so the sensor never fires.
    this.checkGkVirtualCollision = function () {
        // Multiplayer: server is authoritative for all outcomes — skip physics save.
        if (_bMultiplayerMode) return;
        // Guard: only active during a save (not a goal), ball in flight, once only.
        if (!_bLaunched || _bMakeGoal || _bGoal || _bSaved || _bGkIntercepted || _bPoleCollide) return;

        var oBallBody = _oScene.ballBody();
        if (oBallBody.position.y < GK_INTERCEPT_Y) return;

        // Visual-first overlap check:
        var bOverlap = this._checkGkVisualOverlap();
        if (!bOverlap) {
            // Let the ball continue until it hits the hands visually,
            // or if it goes past the goal line (y >= 130) without overlap, it is NOT saved!
            return;
        }

        // ── Record exact impact position ──────────────────────────────────
        _bGkIntercepted = true;
        _fGkImpactX     = oBallBody.position.x;

        // Apply shared physical deflection
        this._applyGkPhysicsDeflection(oBallBody);

        // ── Trigger save effects (text, sound, scoring reset) ─────────────
        this.goalKeeperSave();
    };

    // ─── checkMpOutcome ─────────────────────────────────────────────────────
    // Multiplayer physics-based outcome checking. Evaluates ball coordinates
    // and server outcomes, displaying GOAL!, SAVED!, or MISSED! precisely on collision.
    this.checkMpOutcome = function () {
        if (!_bMultiplayerMode) return;
        if (!_bLaunched) return;
        console.log("[DEBUG] checkMpOutcome: Y=" + _oScene.ballBody().position.y.toFixed(2) + " isMiss=" + _bIsMiss + " makeGoal=" + _bMakeGoal + " saved=" + _bSaved + " goal=" + _bGoal + " ballOut=" + _bBallOut);
        if (_bGoal || _bSaved || _bBallOut) return;
        if (!_bMpResultReceived) return;

        var oBallBody = _oScene.ballBody();
        var oPos = oBallBody.position;

        // 1. Check for SAVE at GK_INTERCEPT_Y (126)
        if (!_bMakeGoal && !_bIsMiss) {
            if (oPos.y >= GK_INTERCEPT_Y) {
                // Visual-first overlap check:
                var bOverlap = this._checkGkVisualOverlap();
                if (!bOverlap) {
                    // Let the ball continue until it hits the hands visually,
                    // or as a safety fallback if it crosses the goal line (y >= 130), save it anyway
                    if (oPos.y < 130) {
                        return;
                    }
                }

                _bSaved = true;
                _fTimeReset = TIME_RESET_AFTER_SAVE;
                
                _oInterface.createAnimText(TEXT_SAVED, 80, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
                playSound('ball_saved', 1, false);

                // Apply shared physical deflection:
                this._applyGkPhysicsDeflection(oBallBody);
            }
        }
        
        // 2. Check for GOAL at GOAL_KEEPER_DEPTH_Y (130)
        else if (_bMakeGoal) {
            if (oPos.y >= 130) {
                _bGoal = true;
                _fTimeReset = TIME_RESET_AFTER_GOAL;
                this.textGoal();
                playSound('goal', 1, false);
            }
        }

        // 3. Check for MISS at GOAL_KEEPER_DEPTH_Y (130)
        else if (_bIsMiss) {
            if (oPos.y >= 130) {
                _bSaved = true; // triggers scene reset sequence
                _fTimeReset = TIME_RESET_AFTER_BALL_OUT;
                _oInterface.createAnimText(TEXT_BALL_OUT, 90, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
                playSound('ball_saved', 1, false);
            }
        }
    };

    // Compute sideways deflection based on which animation type the GK is playing.
    // Ball was heading TOWARD the save side → deflect AWAY from it.
    this._getGkDeflectionX = function (fOrigVelX) {
        var iAnimType = _oGoalKeeper.getAnimType();
        var fRetain   = fOrigVelX * 0.22;           // retain 22 % of original X
        var fScatter  = (Math.random() - 0.5) * 5;

        switch (iAnimType) {
            // Ball heading right → GK palm pushes it rightward (toward corner/post)
            case RIGHT:  case SIDE_RIGHT:  case SIDE_RIGHT_UP:  case SIDE_RIGHT_DOWN:  case RIGHT_UP:  case RIGHT_DOWN:
                return fRetain + 3.5 + Math.random() * 4;

            // Ball heading left → deflect leftward
            case LEFT:   case SIDE_LEFT:   case SIDE_LEFT_UP:   case SIDE_LEFT_DOWN:   case LEFT_UP:   case LEFT_DOWN:
                return fRetain - 3.5 - Math.random() * 4;

            // Centre saves (or GK still in reaction-delay IDLE state) — scatter randomly
            default:
                return fRetain + fScatter;
        }
    };

    this.calculateScore = function () {
        var iProbability = AREAS_INFO[_iArea].probability;
        var iSub = MAX_PERCENT_PROBABILITY - iProbability;
        var iScoreNoMult = (MAX_PERCENT_PROBABILITY - iSub);
        this.addScore(iScoreNoMult * _fMultiplier, iScoreNoMult);
        _fMultiplier += MULTIPLIER_STEP;
    };

    this.goalProbability = function () {
        _iArea = -1;
        this.calculateAreaGoal(_vHitDir);

        if (_iArea === -1) {
            return false;
        }

        var aProb = new Array();

        for (var i = 0; i < MAX_PERCENT_PROBABILITY; i++) {
            aProb.push(false);
        }

        for (var i = 0; i < AREAS_INFO[_iArea].probability; i++) {
            aProb[i] = true;
        }

        var iRandResult = Math.floor(Math.random() * aProb.length);
        return aProb[iRandResult];
    };

    this.addImpulseToBall = function (oDir) {
        if (_bLaunched || _iGameState !== STATE_PLAY) {
            return;
        }
        var oBall = _oScene.ballBody();
        _oScene.addImpulse(oBall, oDir);
        _oScene.setElementAngularVelocity(oBall, { x: 0, y: 0, z: 0 });
        _bLaunched = true;
        _oBall.setVisible(true);
        _oStartBall.setVisible(false);
        this.chooseDirectionGoalKeeper(oDir);
        playSound("kick", 1, false);
    };

    this.chooseDirectionGoalKeeper = function () {
        var self = this;
        var pBallFinalPos = this.predictBallGoalPos(_vHitDir);

        var bScoredOrMiss = _bMakeGoal || _bIsMiss;
        var fFlightTimeMs = _getBallFlightTime(_vHitDir.y, bScoredOrMiss ? 130 : 126);
        
        // --- Difficulty & Error Calibration (Human Mistakes / Realism) ---
        var fErrorX = 0;
        var fErrorY = 0;
        var fExtraDelay = 0;

        if (!_bMultiplayerMode) {
            // Only apply human errors / reaction adjustments in Single Player mode
            var fSpeedNorm = (_vHitDir.y - 50) / 16; // 0 to 1
            var fDistXNorm = Math.min(1.0, Math.abs(pBallFinalPos.x) / 350); // 0 to 1
            var fShotDifficulty = fSpeedNorm * 0.4 + fDistXNorm * 0.6;
            fShotDifficulty = Math.max(0, Math.min(1.0, fShotDifficulty));

            // surprised / late reaction chance (up to 180ms delay on hard shots)
            if (Math.random() < fShotDifficulty * 0.5) {
                fExtraDelay = fShotDifficulty * 180;
            }

            // imperfect positioning error (up to 80 pixels horizontally, 40 vertically)
            if (fShotDifficulty > 0.3) {
                fErrorX = (Math.random() - 0.5) * fShotDifficulty * 80;
                fErrorY = (Math.random() - 0.5) * fShotDifficulty * 40;
            }
        }

        var fReaction = Math.max(120, Math.min(220, 120 + (65 - _vHitDir.y) * 6.6)) + fExtraDelay;
        var fMoveTime = fFlightTimeMs - fReaction;
        var fAnticTime = Math.max(60, Math.min(120, fMoveTime * 0.20));
        var fDiveTime = Math.max(250, Math.min(480, fMoveTime * 0.80));
        var fActualMoveTime = fAnticTime + fDiveTime;
        var fDiveDelay = fFlightTimeMs - fActualMoveTime;
        fDiveDelay = Math.max(30, Math.min(800, fDiveDelay));

        // ── Multiplayer: GK anim is server-authoritative ──────────────────────────
        if (_bMultiplayerMode) {
            // Guard: only play once per round — onMpRoundResult may arrive
            // before OR after SHOOT_FRAME, causing a double-trigger without this.
            if (_bMpGkAnimPlayed) return;

            if (_iPrecomputedGkAnim !== -1) {
                _bMpGkAnimPlayed = true;

                var N = NUM_SPRITE_GOALKEEPER[_iPrecomputedGkAnim];
                var C = Math.floor(N * 0.60);
                var fAnimSpeedScale = (C * 60) / fActualMoveTime;

                setTimeout(function () {
                    if (!_bMakeGoal) {
                        _oGoalKeeper.runAnimAndShift(_iPrecomputedGkAnim, pBallFinalPos, fAnticTime, fDiveTime, fAnimSpeedScale, 0, 0);
                    } else {
                        _oGoalKeeper.runAnimWrongDir(_iPrecomputedGkAnim, fAnticTime, fDiveTime, fAnimSpeedScale);
                    }
                    _bAnimGoalKeeper = true;
                }, fDiveDelay);
            }
            // If server result hasn't arrived yet (_iPrecomputedGkAnim === -1), do
            // nothing now — onMpRoundResult will call us back via _mpTriggerGkAnim().
            return;
        }

        // Single Player:
        setTimeout(function () {
            if (_bMakeGoal) {
                // Single-player goal: GK dives convincingly wrong direction
                self.chooseWrongDirGK(fAnticTime, fDiveTime);
            } else {
                var iAnimIndex = _iArea;
                // Remap corner low shots to better-fitting side animations
                if (pBallFinalPos.y < 75) {
                    if (_iArea === 14) { iAnimIndex = 9; }
                    if (_iArea === 10) { iAnimIndex = 5; }
                }
                var iAnimVal = AREA_GOALS_ANIM[iAnimIndex];
                var N = NUM_SPRITE_GOALKEEPER[iAnimVal];
                var C = Math.floor(N * 0.60);
                var fAnimSpeedScale = (C * 60) / fActualMoveTime;

                _oGoalKeeper.runAnimAndShift(iAnimVal, pBallFinalPos, fAnticTime, fDiveTime, fAnimSpeedScale, fErrorX, fErrorY);
            }
            _bAnimGoalKeeper = true;
        }, fDiveDelay);
    };

    this.chooseWrongDirGK = function (fAnticTime, fDiveTime) {
        fAnticTime = fAnticTime || 115;
        fDiveTime = fDiveTime || 450;

        // Build candidate list by iterating AREA_GOALS_ANIM values (not raw indices)
        var aExclusionList = ANIM_GOAL_KEEPER_FAIL_EXCLUSION_LIST[_iArea];
        var aAnim = new Array();
        for (var i = 0; i < AREA_GOALS_ANIM.length; i++) {
            var animVal = AREA_GOALS_ANIM[i];
            if (aExclusionList.indexOf(animVal) === -1) { aAnim.push(animVal); }
        }
        if (aAnim.length === 0) { aAnim = [LEFT, RIGHT]; }  // safety fallback
        var iRandAnim = Math.floor(Math.random() * aAnim.length);
        var iAnimIndex = aAnim[iRandAnim];

        var N = NUM_SPRITE_GOALKEEPER[iAnimIndex];
        var C = Math.floor(N * 0.60);
        var fAnimSpeedScale = (C * 60) / (fAnticTime + fDiveTime);

        // Use runAnimWrongDir: adds directional body commitment rather than a static pose
        _oGoalKeeper.runAnimWrongDir(iAnimIndex, fAnticTime, fDiveTime, fAnimSpeedScale);
    };

    this.predictBallGoalPos = function (pDirection) {
        var iNormalizedX = pDirection.x / pDirection.y;
        var iNormalizedY = pDirection.z / pDirection.y;

        var iFinalX = linearFunction(iNormalizedX, STRIKER_GOAL_SHOOTAREA.lx, STRIKER_GOAL_SHOOTAREA.rx, -_pGoalSize.w / 2, _pGoalSize.w / 2);
        /// PARABOLIC FUNCTION. THE Y TEND TO GO BOTTOM TO THE GOAL WINDOW FOR THE GRAVITY. SO THE MORE Z POWER, AND MORE HIGHER IS THE TRAJECTORY
        var iFinalY = (-_pGoalSize.h / Math.pow(STRIKER_GOAL_SHOOTAREA.zmax, 2)) * iNormalizedY * iNormalizedY + _pGoalSize.h / 2;

        return { x: iFinalX, y: iFinalY };
    };

    this.calculateAreaGoal = function (pDirection) {
        _iArea = -1;

        var oPos = this.predictBallGoalPos(pDirection);


        var iStartX = -_pGoalSize.w / 2;
        var iStartY = -_pGoalSize.h / 2;


        var iCol = linearFunction(oPos.x, iStartX, iStartX + _pGoalSize.w, 0, NUM_AREA_GOAL.w);
        iCol = Math.floor(iCol);
        if (iCol > NUM_AREA_GOAL.w - 1) {
            iCol = NUM_AREA_GOAL.w - 1;
        } else if (iCol < 0) {
            iCol = 0;
        }

        var iRow = linearFunction(oPos.y, iStartY, iStartY + _pGoalSize.h, 0, NUM_AREA_GOAL.h);
        iRow = Math.floor(iRow);
        if (iRow > NUM_AREA_GOAL.h - 1) {
            iRow = NUM_AREA_GOAL.h - 1;
        } else if (iRow < 0) {
            iRow = 0;
        }


        _iArea = iRow * NUM_AREA_GOAL.w + iCol;


        return _iArea;
    };

    this.pause = function (bVal) {
        if (bVal) {
            _iGameState = STATE_PAUSE;
        } else {
            _iGameState = STATE_PLAY;
        }
        createjs.Ticker.paused = bVal;
    };

    this.onExit = function () {
        this.unload();

        $(s_oMain).trigger("show_interlevel_ad");
        $(s_oMain).trigger("end_session");
        setVolume("soundtrack", 1);
        s_oMain.gotoMenu();
    };

    this.restartLevel = function () {
        this.resetValues();
        this.resetScene();

        _iGameState = STATE_PLAY;
        this.startOpponentShot();
        $(s_oMain).trigger("restart_level", _iLevel);
    };

    this.resetBallPosition = function () {
        var oBallBody = _oScene.ballBody();

        oBallBody.position.set(POSITION_BALL.x, POSITION_BALL.y, POSITION_BALL.z);
        _oScene.setElementVelocity(oBallBody, { x: 0, y: 0, z: 0 });
        _oScene.setElementAngularVelocity(oBallBody, { x: 0, y: 0, z: 0 });

        _oBall.fadeAnimation(1, 500, 0);
        _oBall.setVisible(false);

        _oStartBall.setVisible(true);
        _oStartBall.setAlpha(0);
        _oStartBall.fadeAnim(1, 500, 0);
    };

    this.ballFadeForReset = function () {
        if (!_bSaved || !_bGoal || !_bBallOut) {
            return;
        }
        if (!_bFieldCollide) {
            _oBall.fadeAnimation(0, 300, 10);
            _bFieldCollide = true;
        }
    };

    this._updateInit = function () {
        _oScene.update();
        this._updateBall2DPosition();
        _iGameState = STATE_PLAY;
    };

    this.convert2dScreenPosTo3d = function (oPos2d) {
        var iWidth = (s_iCanvasResizeWidth);
        var iHeight = (s_iCanvasResizeHeight);

        var mouse3D = new THREE.Vector3((oPos2d.x / iWidth) * 2 - 1, //x
            -(oPos2d.y / iHeight) * 2 + 1, //y
            -1);                                            //z
        mouse3D.unproject(_oCamera);
        mouse3D.sub(_oCamera.position);
        mouse3D.normalize();

        var fFactor = 0;//object.y

        mouse3D.multiply(new THREE.Vector3(fFactor, 1, fFactor));

        return mouse3D;
    };

    this.convert3dPosTo2dScreen = function (pos, oCamera) {
        var v3 = new THREE.Vector3(pos.x, pos.y, pos.z);
        var vector = v3.project(oCamera);

        var widthHalf = Math.floor(s_iCanvasResizeWidth) * 0.5;
        var heightHalf = Math.floor(s_iCanvasResizeHeight) * 0.5;


        vector.x = ((vector.x * widthHalf) + widthHalf) * s_fInverseScaling;
        vector.y = (-(vector.y * heightHalf) + heightHalf) * s_fInverseScaling;

        return vector;
    };

    this.timeReset = function () {
        // In multiplayer, the server drives all round timing via onMpRoundResult.
        // Never let the single-player countdown call endTurn().
        if (_bMultiplayerMode) { return; }

        if (_fTimeReset > 0) {
            _fTimeReset -= s_iTimeElaps;
        } else {
            this.endTurn();
        }
    };

    this.restartGame = function () {
        this.resetValues();
        this.resetScene();
        _iGameState = STATE_PLAY;
        _bLaunched = false;
    };

    this.endTurn = function () {
        // In multiplayer the round lifecycle is driven by the server.
        if (_bMultiplayerMode) { return; }

        _iLaunch++;
        _oInterface.refreshLaunchBoard(_iLaunch, NUM_OF_PENALTY);
        if (_iLaunch < NUM_OF_PENALTY) {
            this.resetScene();
            _bLaunched = false;
            _fTimeSwipe = MS_TIME_SWIPE_START;
        } else {
            _iGameState = STATE_FINISH;

            if (_iScore > s_iBestScore) {
                s_iBestScore = Math.floor(_iScore);
                saveItem(LOCALSTORAGE_STRING[LOCAL_BEST_SCORE], Math.floor(_iScore));
            }
            _oInterface.createWinPanel(Math.floor(_iScore));
            $(s_oMain).trigger("end_level", _iLevel);
        }
    };

    this.textGoal = function () {
        _oInterface.createAnimText('GOAL!', 90, false, TEXT_COLOR, TEXT_COLOR_STROKE);
    };

    this.goalAnimation = function (fForce) {
        if (fForce > FORCE_BALL_DISPLAY_SHOCK[0].min && fForce < FORCE_BALL_DISPLAY_SHOCK[0].max) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[0].time, INTENSITY_DISPLAY_SHOCK[0].x, INTENSITY_DISPLAY_SHOCK[0].y);
        } else if (fForce > FORCE_BALL_DISPLAY_SHOCK[1].min && fForce < FORCE_BALL_DISPLAY_SHOCK[1].max) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[1].time, INTENSITY_DISPLAY_SHOCK[1].x, INTENSITY_DISPLAY_SHOCK[1].y);
        } else if (fForce > FORCE_BALL_DISPLAY_SHOCK[2].min && fForce < FORCE_BALL_DISPLAY_SHOCK[2].max) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[2].time, INTENSITY_DISPLAY_SHOCK[2].x, INTENSITY_DISPLAY_SHOCK[2].y);
        } else if (fForce > FORCE_BALL_DISPLAY_SHOCK[3].min) {
            this.displayShock(INTENSITY_DISPLAY_SHOCK[3].time, INTENSITY_DISPLAY_SHOCK[3].x, INTENSITY_DISPLAY_SHOCK[3].y);
        }
    };

    this.displayShock = function (iTime, iXIntensity, iYIntensity) {
        var xShifting = iXIntensity;
        var yShifting = iYIntensity;

        createjs.Tween.get(_oContainerGame).to({ x: Math.round(Math.random() * xShifting), y: Math.round(Math.random() * yShifting) }, iTime).call(function () {
            createjs.Tween.get(_oContainerGame).to({ x: Math.round(Math.random() * xShifting * 0.8), y: -Math.round(Math.random() * yShifting * 0.8) }, iTime).call(function () {
                createjs.Tween.get(_oContainerGame).to({ x: Math.round(Math.random() * xShifting * 0.6), y: Math.round(Math.random() * yShifting * 0.6) }, iTime).call(function () {
                    createjs.Tween.get(_oContainerGame).to({ x: Math.round(Math.random() * xShifting * 0.4), y: -Math.round(Math.random() * yShifting * 0.4) }, iTime).call(function () {
                        createjs.Tween.get(_oContainerGame).to({ x: Math.round(Math.random() * xShifting * 0.2), y: Math.round(Math.random() * yShifting * 0.2) }, iTime).call(function () {
                            createjs.Tween.get(_oContainerGame).to({ y: 0, x: 0 }, iTime)
                        });
                    });
                });
            });
        });
    };

    this.resetScene = function () {
        // Clear any pending result texts (Goal/Saved/Out) before starting the next round
        if (_oInterface && typeof _oInterface.clearAnimTextQueue === 'function') {
            _oInterface.clearAnimTextQueue();
        }

        _bGoal = false;
        _bBallOut = false;
        _bSaved = false;
        _bMakeGoal = false;
        _bPoleCollide = false;
        _bFieldCollide = false;
        _bMpResultReceived = false;  // reset server-result gate for next round
        _bIsMiss = false;            // reset miss flag for next round
        _bTimeoutTriggered = false;  // reset timeout flag for next round
        _iPrecomputedGkAnim = -1;   // clear synced GK anim
        _bAnimGoalKeeper = false;
        _fGkFadeDelay = 0;           // cancel any pending fade hold
        _bGkIntercepted = false;     // clear virtual collision flag
        _fGkImpactX     = 0;
        _bMpGkAnimPlayed = false;    // allow GK anim for next round
        _bMpSaveFired    = false;    // allow save deflection for next round
        if (_iMpSaveTimer !== null) {
            clearTimeout(_iMpSaveTimer);  // cancel any pending save timer from prior round
            _iMpSaveTimer = null;
        }
        _bHelpTextHidden = false;
        _bSwipeHintShown = false;    // reset hint status for next round
        _oGoalKeeper.resetToStartPosition(); // snap before fade-in so position is clean
        _oGoalKeeper.setAlpha(0);
        _oGoalKeeper.fadeAnimation(1);
        _oGoalKeeper.runAnim(IDLE);
        this.resetBallPosition();
        this.sortDepth(_oBall, _oGoal);

        if (!_bMultiplayerMode) {
            if (_oInterface && typeof _oInterface.showTurnMessage === 'function') {
                _oInterface.showTurnMessage(true, true);
            }
            if (_oStartBall && typeof _oStartBall.showGlow === 'function') {
                _oStartBall.showGlow(true);
            }
        }
    };

    this._onEnd = function () {
        this.onExit();
    };

    this.swapChildrenIndex = function () {
        for (var i = 0; i < _aObjects.length - 1; i++) {
            for (var j = i + 1; j < _aObjects.length; j++) {
                if (_aObjects[i].getObject().visible && _aObjects[j].getObject().visible)
                    this.sortDepth(_aObjects[i], _aObjects[j]);
            }
        }
    };

    this.ballOut = function () {
        // In multiplayer the server decides the result — skip local ballOut handling.
        if (_bMultiplayerMode) { return; }

        if (!_bBallOut && !_bGoal && !_bSaved) {
            var oPos = _oBall.getPhysics().position;
            // Immediate miss check: if the ball crosses the goal line sensor plane (y >= 133.5)
            // without a goal or save collision, it has missed.
            if (oPos.y >= 133.5 || oPos.x > BACK_WALL_GOAL_SIZE.width || oPos.x < -BACK_WALL_GOAL_SIZE.width) {
                _bBallOut = true;
                _fTimeReset = TIME_RESET_AFTER_BALL_OUT;
                _oInterface.createAnimText(TEXT_BALL_OUT, 90, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
                playSound("ball_saved", 1, false);
                _fMultiplier = 1;
                _iCombo = 0;
            }
        }
    };

    this.animPlayer = function () {
        if (!_bAnimPlayer) {
            _oPlayer.setVisible(false);
            return;
        }

        _bAnimPlayer = _oPlayer.animPlayer();

        if (_oPlayer.getFrame() === SHOOT_FRAME) {
            this.addImpulseToBall({
                x: _vHitDir.x,
                y: _vHitDir.y, z: _vHitDir.z
            });
            _iTimePressDown = 0;
            this.goalAnimation(_vHitDir.y);
            _oInterface.unloadHelpText();
        }
    };

    this.animGoalKeeper = function () {
        if (_bLaunched) {
            if (_bAnimGoalKeeper) {
                _bAnimGoalKeeper = _oGoalKeeper.update();
                if (!_bAnimGoalKeeper) {
                    // Animation finished — hold last frame while recovery tween plays out
                    _oGoalKeeper.viewFrame(_oGoalKeeper.getAnimArray(), _oGoalKeeper.getAnimArray().length - 1);
                    _oGoalKeeper.hideFrame(_oGoalKeeper.getAnimArray(), 0);
                    _fGkFadeDelay = 850;  // ms to stay visible after anim ends
                }
            } else if (_fGkFadeDelay > 0) {
                // Countdown before fading — keeps GK visible during recovery tween
                _fGkFadeDelay -= s_iTimeElaps;
                if (_fGkFadeDelay <= 0) {
                    _fGkFadeDelay = 0;
                    _oGoalKeeper.fadeAnimation(0);
                }
            } else {
                // Reaction-delay phase: dive not committed yet — keep running current anim
                _oGoalKeeper.update();
            }
        } else if (!_bAnimPlayer) {
            // Pre-kick: run idle GK animation
            _oGoalKeeper.update();
        }
    };

    this.resetPoleCollision = function () {
        if (_bMultiplayerMode) { return; }
        if (_fTimePoleReset > 0) {
            _fTimePoleReset -= s_iTimeElaps;
        } else {
            if (!_bGoal && !_bSaved) {
                _oInterface.createAnimText(TEXT_BALL_OUT, 80, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
                _fMultiplier = 1;
                _iCombo = 0;
                playSound("ball_saved", 1, false);
                this.endTurn();
                _fTimePoleReset = TIME_POLE_COLLISION_RESET;
            }
        }
    };

    this.handSwipeAnim = function () {
        if (_bLaunched || _bHelpTextHidden) {
            if (_oInterface && _oInterface.showHelpText) { _oInterface.showHelpText(false); }
            return;
        }
        if (_bMultiplayerMode && (!_bIsMyTurn || _bReplayingKick)) {
            if (_oHandSwipeAnim) { _oHandSwipeAnim.setVisible(false); }
            if (_oInterface && _oInterface.showHelpText) { _oInterface.showHelpText(false); }
            return;
        }

        if (_oHandSwipeAnim && !_bSwipeHintShown) {
            _bSwipeHintShown = true;
            _oHandSwipeAnim.animAllSwipe();
        }

        if (_oHandSwipeAnim && _oHandSwipeAnim.isAnimate()) {
            _oHandSwipeAnim.setVisible(true);
        } else if (_oHandSwipeAnim) {
            _oHandSwipeAnim.setVisible(false);
        }

        if (!_bMultiplayerMode || _bIsMyTurn) {
            if (_oInterface && _oInterface.showHelpText) { _oInterface.showHelpText(true); }
        }
        _fTimeSwipe = MS_TIME_SWIPE_START;
    };

    this.swapGoal = function () {
        if (_oBall.getPhysics().position.z > GOAL_SPRITE_SWAP_Z) {
            this.sortDepth(_oBall, _oGoal);
        }
    };

    this._updatePlay = function () {
        for (var i = 0; i < PHYSICS_ACCURACY; i++) {
            _oScene.update();
        }

        if (_bMultiplayerMode && _bLaunched && _iPrecomputedGkAnim !== -1 && !_bMpGkAnimPlayed) {
            this._mpTriggerGkAnim(_bMakeGoal);
        }

        // Multiplayer authoritative outcome checking (based on physics position)
        this.checkMpOutcome();

        // Virtual GK body collision: intercepts ball before goal-line sensor (y≈131)
        // so the ball stops at the GK sprite rather than passing through it.
        this.checkGkVirtualCollision();

        this.ballOut();

        if (_bGoal || _bBallOut || _bSaved) {
            this.timeReset();
        } else if (_bPoleCollide) {
            this.resetPoleCollision();
        }

        this.animGoalKeeper();

        this.animPlayer();

        this._updateBall2DPosition();

        this.handSwipeAnim();

        this.swapChildrenIndex();

        this.swapGoal();
    };

    this.update = function () {

        switch (_iGameState) {
            case STATE_INIT:
                this._updateInit();
                break;
            case STATE_PLAY:
                this._updatePlay();
                break;
            case STATE_FINISH:

                break;
            case STATE_PAUSE:

                break;
        }
    };

    this._updateBall2DPosition = function () {

        this.ballPosition();
        _oBall.rolls();


        _oCamera.updateProjectionMatrix();
        _oCamera.updateMatrixWorld();
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // MULTIPLAYER METHODS â€” kept INSIDE CGame constructor so `this` is correct
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    this.initMultiplayer = function (oStartData) {
        _bMultiplayerMode = true;
        _bReplayingKick = false;
        // Immediately hide swipe text — shown only on MY TURN
        if (_oInterface && _oInterface.showHelpText) { _oInterface.showHelpText(false); }
        _sMyPlayerId = String(oStartData.myPlayerId);
        _iP1Score = 0;
        _iP2Score = 0;
        _iP1Shots = 0;
        _iP2Shots = 0;
        _bGameOver = false;

        _bIsMyTurn = (String(oStartData.firstKickerId) === _sMyPlayerId);
        _sCurrentTurn = _bIsMyTurn ? 'mine' : 'theirs';

        // Resolve opponent name and avatar from player list
        var oppName = 'Opponent';
        var oppAvatar = '🤖';
        var myAvatar = '⚽';
        if (oStartData.players) {
            for (var i = 0; i < oStartData.players.length; i++) {
                if (String(oStartData.players[i].playerId) !== _sMyPlayerId) {
                    oppName = oStartData.players[i].name;
                    oppAvatar = oStartData.players[i].avatar || '🤖';
                } else {
                    myAvatar = oStartData.players[i].avatar || '⚽';
                }
            }
        }

        var myName = (s_oMultiplayer && s_oMultiplayer.getMyName) ? s_oMultiplayer.getMyName() : 'You';
        this._createMpHUD(myName, oppName, myAvatar, oppAvatar);

        // Wire CMultiplayer callbacks to our handlers
        var self = this;
        s_oMultiplayer.onRoundResult = function (data) { self.onMpRoundResult(data); };
        s_oMultiplayer.onGameEnd = function (data) { self._mpEndGame(data); };
        s_oMultiplayer.onOpponentLeft = function () { self._mpOpponentLeft(); };
        s_oMultiplayer.onTimerTick = function (t) { self._mpTimerTick(t); };
        s_oMultiplayer.onTurnTimeout = function () { self._mpTimerOut(); };

        this._updateTurnState();
    };

    // ── Create FIFA-style HTML HUD ───────────────────────────────────────────────
    this._createMpHUD = function (szMyName, szOppName, szMyAvatar, szOppAvatar) {
        _sMpMyName = szMyName || 'You';
        _sMpOppName = szOppName || 'Opp';
        var iMax = (s_oMultiplayer && s_oMultiplayer.getShotsPerPlayer)
            ? s_oMultiplayer.getShotsPerPlayer() : NUM_OF_PENALTY;
        _oMpHUD = new CMpHUD();
        _oMpHUD.init(_sMpMyName, _sMpOppName, iMax, szMyAvatar, szOppAvatar);
        s_oMpHUD = _oMpHUD;
    };

    // ── No-op (HUD handles shot count internally) ─────────────────────────────
    var _refreshShotsText = function () { };

    // â”€â”€ Update turn state (enable/disable input, timer, HUD text) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._updateTurnState = function () {
        if (_bGameOver) return;
        if (_iOppTimerInterval) { clearInterval(_iOppTimerInterval); _iOppTimerInterval = null; }
        if (_oMpHUD) { _oMpHUD.setTurn(_bIsMyTurn); }
        if (_bIsMyTurn) {
            this._enableInput();
            _bSwipeHintShown = false;
            if (_oHandSwipeAnim) { _oHandSwipeAnim.setVisible(true); }
            if (_oInterface && _oInterface.showHelpText) { _oInterface.showHelpText(true); }
            if (s_oMultiplayer && s_oMultiplayer.startTimer) { s_oMultiplayer.startTimer(); }

            if (_oInterface && typeof _oInterface.showTurnMessage === 'function') {
                _oInterface.showTurnMessage(true, true);
            }
            if (_oStartBall && typeof _oStartBall.showGlow === 'function') {
                _oStartBall.showGlow(true);
            }
        } else {
            this._disableInput();
            if (_oHandSwipeAnim) { _oHandSwipeAnim.setVisible(false); }
            if (_oInterface && _oInterface.showHelpText) { _oInterface.showHelpText(false); }
            if (s_oMultiplayer && s_oMultiplayer.stopTimer) { s_oMultiplayer.stopTimer(); }

            if (_oInterface && typeof _oInterface.showTurnMessage === 'function') {
                _oInterface.showTurnMessage(true, false);
            }
            if (_oStartBall && typeof _oStartBall.showGlow === 'function') {
                _oStartBall.showGlow(false);
            }

            var iOppTime = 15;
            if (_oMpHUD) { _oMpHUD.setTimer(iOppTime, false); }
            _bOppTimedOut = false;   // reset at start of each opponent turn
            _iOppTimerInterval = setInterval(function () {
                iOppTime--;
                if (_oMpHUD) { _oMpHUD.setTimer(Math.max(0, iOppTime), false); }
                if (iOppTime <= 0) {
                    clearInterval(_iOppTimerInterval);
                    _iOppTimerInterval = null;
                    _bOppTimedOut = true;   // opponent ran out of time
                    var hud = _oMpHUD || s_oMpHUD;
                    if (hud) { hud.showResult('OPP TIMEOUT'); }
                }
            }, 1000);
        }
    };

    this._enableInput = function () {
        if (_oHitArea) { _oHitArea.mouseEnabled = true; }
    };
    this._disableInput = function () {
        if (_oHitArea) { _oHitArea.mouseEnabled = false; }
    };

    // â”€â”€ Timer callbacks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._mpTimerTick = function (t) {
        if (_oMpHUD) { _oMpHUD.setTimer(t, true); }
    };
    this._mpTimerOut = function () {
        if (_bGameOver) return;
        if (_bTimeoutTriggered) return;
        _bTimeoutTriggered = true;

        this._disableInput();

        // Show TIMEOUT in HUD — use s_oMpHUD as global fallback
        var hud = _oMpHUD || s_oMpHUD;
        if (hud) { hud.showResult('\u23f1 TIMEOUT'); }

        // Show "MISSED!" text and play miss sound
        _oInterface.createAnimText(TEXT_BALL_OUT, 90, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
        playSound('ball_saved', 1, false);

        // Lock gameplay state so no physics triggers (GOAL/SAVE) can occur
        _bSaved = true;
        _fTimeReset = TIME_RESET_AFTER_BALL_OUT;

        if (s_oMultiplayer && s_oMultiplayer.sendTurnTimeout) {
            s_oMultiplayer.sendTurnTimeout();
        }
    };

    // â”€â”€ ROUND_RESULT handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.onMpRoundResult = function (data) {
        if (_bGameOver) return;
        if (_bMpResultReceived) return; // duplicate prevention

        // Clear opponent local timer countdown immediately
        if (_iOppTimerInterval) {
            clearInterval(_iOppTimerInterval);
            _iOppTimerInterval = null;
        }

        var bIWasKicker = (String(data.kickerId) === _sMyPlayerId);
        if (bIWasKicker) { _iP1Shots++; } else { _iP2Shots++; }
        _refreshShotsText();
        // Record in HUD (dot indicator + flash)
        if (_oMpHUD) { _oMpHUD.recordShot(bIWasKicker, !!data.scored); }

        // ── Mark that server result has arrived — unblock areaGoal() ──
        _bMpResultReceived = true;

        // ── Store server-authoritative GK anim index (syncs both screens) ──
        _iPrecomputedGkAnim = (data.gkAnimIndex !== undefined) ? data.gkAnimIndex : -1;

        // ── Server-authoritative score lookup ──
        var oppId = (_sMyPlayerId === 0) ? 1 : 0;
        var myGoals = 0;
        var oppGoals = 0;
        if (data.scores) {
            myGoals = (data.scores[_sMyPlayerId] !== undefined) ? data.scores[_sMyPlayerId] : (data.scores[String(_sMyPlayerId)] || 0);
            oppGoals = (data.scores[oppId] !== undefined) ? data.scores[oppId] : (data.scores[String(oppId)] || 0);
        }

        var self = this;

        _bMakeGoal = data.scored;
        _bIsMiss = !!data.miss;

        // If this was a timeout, trigger timeout miss feedback if not already done locally
        if (data.isTimeout) {
            if (!_bTimeoutTriggered) {
                _bTimeoutTriggered = true;
                this._disableInput();

                var hud = _oMpHUD || s_oMpHUD;
                if (hud) { hud.showResult('\u23f1 TIMEOUT'); }

                _oInterface.createAnimText(TEXT_BALL_OUT, 90, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
                playSound('ball_saved', 1, false);

                _bSaved = true;
                _fTimeReset = TIME_RESET_AFTER_BALL_OUT;
            }
        } else {
            if (!bIWasKicker) {
                this._replayOpponentKick(data);
            }
        }

        // Update score HUD on both screens
        this._updateMpHUD(myGoals, oppGoals);

        if (data.gameOver) {
            this._mpEndGame(data);
            return;
        }

        // Prepare next turn
        _bIsMyTurn = (String(data.nextKickerId) === _sMyPlayerId);
        _sCurrentTurn = _bIsMyTurn ? 'mine' : 'theirs';

        var iResetDelay = data.isTimeout ? 2500 : 3700;

        setTimeout(function () {
            self.resetScene();
            _bLaunched = false;
            _fTimeSwipe = MS_TIME_SWIPE_START;
            _bReplayingKick = false;
            self._updateTurnState();
        }, iResetDelay);
    };

    // â”€â”€ Replay opponent kick using echoed physics data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // ─── _mpTriggerGkAnim ────────────────────────────────────────────────────
    // Single entry point for starting the GK animation in MP.
    // Guarded by _bMpGkAnimPlayed so it can only fire once per round regardless
    // of which code path reaches it first (SHOOT_FRAME vs onMpRoundResult).
    this._mpTriggerGkAnim = function (bScored) {
        if (_bMpGkAnimPlayed) return;
        if (_iPrecomputedGkAnim === -1) return;
        _bMpGkAnimPlayed = true;

        var pBallFinalPos = this.predictBallGoalPos(_vHitDir);

        var bScoredOrMiss = bScored || _bIsMiss;
        var fFlightTimeMs = _getBallFlightTime(_vHitDir.y, bScoredOrMiss ? 130 : 126);
        
        var fReaction = Math.max(120, Math.min(220, 120 + (65 - _vHitDir.y) * 6.6));
        var fMoveTime = fFlightTimeMs - fReaction;
        var fAnticTime = Math.max(60, Math.min(120, fMoveTime * 0.20));
        var fDiveTime = Math.max(250, Math.min(480, fMoveTime * 0.80));
        var fActualMoveTime = fAnticTime + fDiveTime;
        var fDiveDelay = fFlightTimeMs - fActualMoveTime;
        fDiveDelay = Math.max(30, Math.min(800, fDiveDelay));

        var N = NUM_SPRITE_GOALKEEPER[_iPrecomputedGkAnim];
        var C = Math.floor(N * 0.60);
        var fAnimSpeedScale = (C * 60) / fActualMoveTime;

        setTimeout(function () {
            if (bScored) {
                _oGoalKeeper.runAnimWrongDir(_iPrecomputedGkAnim, fAnticTime, fDiveTime, fAnimSpeedScale);
            } else {
                _oGoalKeeper.runAnimAndShift(_iPrecomputedGkAnim, pBallFinalPos, fAnticTime, fDiveTime, fAnimSpeedScale);
            }
            _bAnimGoalKeeper = true;
        }, fDiveDelay);
    };

    // ─── _mpSaveBall ────────────────────────────────────────────────────────
    // Applies GK deflection physics + SAVED feedback in MP.
    // Idempotent: _bMpSaveFired ensures it only runs once per round.
    // Also guards against being called when ball is no longer in flight.
    this._mpSaveBall = function () {
        // Idempotency: already fired this round
        if (_bSaved && _bMpSaveFired) { return; }

        // Safety: if ball isn't in flight (timed-out kick, or already reset), skip
        var oBallBody = _oScene.ballBody();
        if (!_bLaunched || oBallBody.velocity.y < 0.5) {
            // Ball not meaningfully moving toward goal — skip deflection, still show SAVED
            _bSaved = true;
            _fTimeReset = TIME_RESET_AFTER_SAVE;
            _oInterface.createAnimText(TEXT_SAVED, 80, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
            playSound('ball_saved', 1, false);
            return;
        }

        _bSaved = true;
        _fTimeReset = TIME_RESET_AFTER_SAVE;
        _oInterface.createAnimText(TEXT_SAVED, 80, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
        playSound('ball_saved', 1, false);

        this._applyGkPhysicsDeflection(oBallBody);
    };

    this._replayOpponentKick = function (data) {
        _bReplayingKick = true;
        var kd = data.kickData || {};

        // Fade out opponent turn banner on kick start
        if (_oInterface && typeof _oInterface.showTurnMessage === 'function') {
            _oInterface.showTurnMessage(false);
        }

        // Ensure the ball is in start position (in case previous round left it mid-air)
        this.resetBallPosition();

        // Set kick direction from server echo
        _vHitDir.set(
            (kd.angle !== undefined) ? kd.angle : 0,
            (kd.power !== undefined) ? kd.power : 15,
            (kd.targetY !== undefined) ? kd.targetY : 0
        );
        this.calculateAreaGoal(_vHitDir);

        // Server is authoritative: use data.scored directly
        _bMakeGoal = data.scored;
        _bLaunched = false;

        // Trigger player kick animation; addImpulseToBall fires on SHOOT_FRAME
        _bAnimPlayer = true;
        _oPlayer.setVisible(true);
    };

    // â”€â”€ Update the multiplayer score HUD (shown on both screens) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._updateMpHUD = function (myGoals, oppGoals) {
        if (_oMpHUD) { _oMpHUD.setScore(myGoals, oppGoals); }
    };

    // â”€â”€ Game over â€” show result as in-canvas text, no overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._mpEndGame = function (data) {
        if (_bGameOver) return;
        _bGameOver = true;
        if (_iOppTimerInterval) { clearInterval(_iOppTimerInterval); _iOppTimerInterval = null; }
        if (s_oMultiplayer && s_oMultiplayer.stopTimer) { s_oMultiplayer.stopTimer(); }

        var myGoals = 0;
        var oppGoals = 0;
        if (data.scores) {
            for (var pid in data.scores) {
                // eslint-disable-next-line eqeqeq
                if (pid == _sMyPlayerId) {
                    myGoals = data.scores[pid];
                } else {
                    oppGoals = data.scores[pid];
                }
            }
        }

        this._updateMpHUD(myGoals, oppGoals);

        var sResult;
        if (data.draw) {
            sResult = 'draw';
            // eslint-disable-next-line eqeqeq
        } else if (data.winnerId != null && data.winnerId == _sMyPlayerId) {
            sResult = 'win';
        } else if (data.winnerId != null) {
            sResult = 'lose';
        } else {
            // Fallback: decide by goal count (equal = draw)
            if (myGoals === oppGoals) {
                sResult = 'draw';
            } else {
                sResult = (myGoals > oppGoals) ? 'win' : 'lose';
            }
        }

        // HUD banner text
        var sHudText = (sResult === 'win') ? 'You Win' : (sResult === 'lose') ? 'You Lose' : 'Match Tie';
        var sHudColor = (sResult === 'win') ? '#FFD700' : (sResult === 'lose') ? '#ff4444' : '#aaddff';

        if (_oMpHUD) {
            var sLabel = (sResult === 'win') ? 'YOU WIN' : (sResult === 'lose') ? 'YOU LOSE' : 'MATCH TIE';
            _oMpHUD.showResult(sLabel);
        }

        _oInterface.createAnimText(sHudText, 80, false, sHudColor, '#000000');

        // Build ranked leaderboard (sorted by goals desc, unless draw)
        var aPlayers = [
            { name: _sMpMyName, goals: myGoals, isMe: true },
            { name: _sMpOppName, goals: oppGoals, isMe: false }
        ];
        if (!data.draw) {
            aPlayers.sort(function (a, b) { return b.goals - a.goals; });
        }
        aPlayers[0].rank = 1;
        aPlayers[1].rank = 2;

        var self = this;
        setTimeout(function () {
            if (_oMpHUD) { _oMpHUD.unload(); _oMpHUD = null; s_oMpHUD = null; }
            if (_oInterface && _oInterface.createMpWinPanel) {
                _oInterface.createMpWinPanel({ result: sResult, myName: _sMpMyName, players: aPlayers });
            }
        }, 2500);
    };

    // â”€â”€ Opponent disconnected mid-game â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._mpOpponentLeft = function () {
        if (_bGameOver) return;
        _bGameOver = true;
        if (s_oMultiplayer && s_oMultiplayer.stopTimer) { s_oMultiplayer.stopTimer(); }
        if (_oMpHUD) { _oMpHUD.showResult('OPPONENT LEFT'); }
        _oInterface.createAnimText('You Win', 70, false, '#FFD700', '#000000');
        var aPlayers = [
            { rank: 1, name: _sMpMyName, goals: _iP1Score, isMe: true },
            { rank: 2, name: _sMpOppName + ' (Left)', goals: _iP2Score, isMe: false }
        ];
        var self = this;
        setTimeout(function () {
            if (_oInterface && _oInterface.createMpWinPanel) {
                _oInterface.createMpWinPanel({ result: 'win', myName: _sMpMyName, players: aPlayers });
            }
        }, 2500);
    };

    // â”€â”€ Public getters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.isMultiplayer = function () { return _bMultiplayerMode; };
    this.isMyTurn = function () { return _bIsMyTurn; };
    this.getCurrentTurn = function () { return _sCurrentTurn; };
    this.getTimeLeft = function () { return _iTimeLeft; };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // END MULTIPLAYER METHODS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    s_oGame = this;

    AREAS_INFO = oData.area_goal;
    NUM_OF_PENALTY = oData.num_of_penalty;
    MULTIPLIER_STEP = oData.multiplier_step;
    NUM_LEVEL_FOR_ADS = oData.num_levels_for_ads;

    this._init();
};

var s_oGame;
