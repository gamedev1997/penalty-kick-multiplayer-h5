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

    // â”€â”€â”€ MULTIPLAYER STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    var _bMultiplayerMode = false;
    var _bIsMyTurn = false;
    var _iTurnTimer = 0;
    var _iTimerInterval = null;
    var _iTimeLeft = 15;
    var _oTurnText = null;
    var _oTimerText = null;
    var _bOpponentAnimating = false;
    var _iP1Score = 0;
    var _iP2Score = 0;
    var _iP1Shots = 0;
    var _iP2Shots = 0;
    var _sCurrentTurn = "p1"; // "p1" or "p2"
    var _sMyPlayerId = null;
    var _bGameOver = false;
    var _oMpScoreText = null;
    var _sMpMyName  = 'You';
    var _sMpOppName = 'Opp';
    var _iPrecomputedGkAnim = -1; // synced GK anim index for multiplayer
    var _bMpResultReceived = false; // server result received — block local physics result

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
        _pGoalSize = {w: oSprite.width - iSidePostWidth, h: oSprite.height - iTopPostHeight/2};
        _oGoal = new CGoal(291, 28, oSprite, _oContainerGame);

        
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
        }else{
			TIME_SWIPE = 500;
		}
		
        _oHandSwipeAnim = new CHandSwipeAnim(START_HAND_SWIPE_POS, END_HAND_SWIPE_POS, s_oSpriteLibrary.getSprite(szImage), s_oStage);
        _oHandSwipeAnim.animAllSwipe();

        resizeCanvas3D();

        setVolume("soundtrack", SOUNDTRACK_VOLUME_IN_GAME);

        _oInterface = new CInterface();
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
    };

    this.poleCollide = function () {
        _fTimePoleReset = TIME_POLE_COLLISION_RESET;
        _bPoleCollide = true;
        playSound("pole", 0.4, false);
    };

    this.fieldCollision = function () {
        if (_oFieldCollision === null && _bLaunched) {
            _oFieldCollision = playSound("drop_bounce_grass", 0.3, false);
            if(_oFieldCollision !== null){
                    _oFieldCollision.on('end', function(){
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
        // Block input when it's not our turn in multiplayer
        if (_bMultiplayerMode && !_bIsMyTurn) { return; }

        if (_bLaunched) {
            return;
        }

        _fTimeSwipe = MS_TIME_SWIPE_START;

        _oHandSwipeAnim.removeTweens();
        _oHandSwipeAnim.setVisible(false);

        var iXPos = e.stageX;
        var iYPos = e.stageY;
        if(SHOW_3D_RENDER){
            iXPos = e.x;
            iYPos = e.y;
        }

        _oClickPoint = {x: iXPos / s_fInverseScaling , y: iYPos / s_fInverseScaling };
        _oReleasePoint = {x: iXPos / s_fInverseScaling , y: iYPos / s_fInverseScaling };
        console.log(_oClickPoint)
    };

    this.onPressMove = function (e) {
        var iXPos = e.stageX;
        var iYPos = e.stageY;
        if(SHOW_3D_RENDER){
            iXPos = e.x;
            iYPos = e.y;
        }

        _oReleasePoint = {x: iXPos/ s_fInverseScaling , y: iYPos/ s_fInverseScaling }
        _iTimePressDown += s_iTimeElaps;
    };

    this.onPressUp = function () {
        if (_bLaunched || _oReleasePoint === null) {
            return;
        }else if( (_oClickPoint.y < _oReleasePoint.y) || (_oReleasePoint.x === 0 && _oReleasePoint.y === 0) ){
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
                    angle:   _vHitDir.x,
                    power:   _vHitDir.y,
                    targetY: _vHitDir.z
                });
            }
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

        var oPosShadow = {x: oBody.position.x, y: oBody.position.y, z: oFieldBody.position.z};

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
            if (_bMakeGoal) {
                _bGoal = true;
                _fTimeReset = TIME_RESET_AFTER_GOAL;
                this.textGoal();
                this.calculateScore();
                playSound("goal", 1, false);
            } else {
                this.goalKeeperSave();
            }
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
        _oBall.getPhysics().velocity.negate(_oBall.getPhysics().velocity);
        switch (_iArea) {
            case 12:
                _oBall.getPhysics().velocity = _oBall.getPhysics().velocity.vadd(new CANNON.Vec3(_oBall.getPhysics().velocity.x * 0.4,
                        _oBall.getPhysics().velocity.y * 0.4, _oBall.getPhysics().velocity.z * 0.4));
                break;

            default:
                _oBall.getPhysics().velocity.vsub(new CANNON.Vec3(0, 50, 0));
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
        _oScene.setElementAngularVelocity(oBall, {x: 0, y: 0, z: 0});
        _bLaunched = true;
        _oBall.setVisible(true);
        _oStartBall.setVisible(false);
        this.chooseDirectionGoalKeeper(oDir);
        playSound("kick", 1, false);
    };
    
    this.chooseDirectionGoalKeeper = function () {

        var pBallFinalPos = this.predictBallGoalPos(_vHitDir);

        // In multiplayer: server is authoritative for GK anim — use precomputed index.
        if (_bMultiplayerMode) {
            if (_iPrecomputedGkAnim !== -1) {
                // Save: GK dives to ball | Goal: GK dives wrong way (no shift)
                if (!_bMakeGoal) {
                    _oGoalKeeper.runAnimAndShift(_iPrecomputedGkAnim, pBallFinalPos);
                } else {
                    _oGoalKeeper.runAnim(_iPrecomputedGkAnim);
                }
            }
            _bAnimGoalKeeper = true;
            return;
        }

        if (_bMakeGoal) {
            // Single-player goal: GK dives wrong direction
            this.chooseWrongDirGK();
        } else {
            var iAnimIndex = _iArea;
            if (pBallFinalPos.y < 75) {
                if (_iArea === 14) { iAnimIndex = 9; }
                if (_iArea === 10) { iAnimIndex = 5; }
            }
            console.log("iAnimIndex " + iAnimIndex);
            _oGoalKeeper.runAnimAndShift(AREA_GOALS_ANIM[iAnimIndex], pBallFinalPos);
        }

        _bAnimGoalKeeper = true;
    };
/*
    this.chooseDirectionGoalKeeper = function (oDirBall) {
        if (!_bMakeGoal) {
            switch (_iArea) {
                case - 1 :
                    if (oDirBall.x < GOAL_KEEPER_TOLLERANCE_LEFT) {
                        _oGoalKeeper.runAnim(LEFT);
                    } else if (oDirBall.y > GOAL_KEEPER_TOLLERANCE_RIGHT) {
                        _oGoalKeeper.runAnim(RIGHT);
                    }
                    break;
                default:
                    _oGoalKeeper.runAnim(AREA_GOALS_ANIM[_iArea]);
            }
        } else {
            var iNoAnim = _oGoalKeeper.getAnimType();
            switch (_iArea) {
                case 2:
                case 7:
                case 12:
                    this.chooseWrongDirGK();
                    break;

                default:
                    this.chooseWrongDirGK();
                    break;
            }
        }
        _bAnimGoalKeeper = true;
    };*/

    this.chooseWrongDirGK = function () {
        // In multiplayer: use pre-computed index so both screens show same GK anim
        if (_bMultiplayerMode && _iPrecomputedGkAnim !== -1) {
            _oGoalKeeper.runAnim(_iPrecomputedGkAnim);
            return;
        }

        var aExclusionList = ANIM_GOAL_KEEPER_FAIL_EXCLUSION_LIST[_iArea];
        var aAnim = new Array();
        for (var i = 1; i <= AREA_GOALS_ANIM.length; i++) {
            if (aExclusionList.indexOf(i) === -1) { aAnim.push(i); }
        }
        var iRandAnim = Math.floor(Math.random() * aAnim.length);
        _oGoalKeeper.runAnim(aAnim[iRandAnim]);
    };
    
    this.predictBallGoalPos = function (pDirection) {
        var iNormalizedX = pDirection.x / pDirection.y;
        var iNormalizedY = pDirection.z / pDirection.y;

        var iFinalX = linearFunction(iNormalizedX, STRIKER_GOAL_SHOOTAREA.lx, STRIKER_GOAL_SHOOTAREA.rx, -_pGoalSize.w/2, _pGoalSize.w/2);
        /// PARABOLIC FUNCTION. THE Y TEND TO GO BOTTOM TO THE GOAL WINDOW FOR THE GRAVITY. SO THE MORE Z POWER, AND MORE HIGHER IS THE TRAJECTORY
        var iFinalY = (-_pGoalSize.h/Math.pow(STRIKER_GOAL_SHOOTAREA.zmax,2))*iNormalizedY*iNormalizedY +_pGoalSize.h/2;

        return {x: iFinalX, y: iFinalY};
    };
    
    this.calculateAreaGoal = function (pDirection) {
        _iArea = -1;

        var oPos = this.predictBallGoalPos(pDirection);


        var iStartX = -_pGoalSize.w/2;
        var iStartY = -_pGoalSize.h/2;


        var iCol = linearFunction(oPos.x, iStartX, iStartX+_pGoalSize.w, 0, NUM_AREA_GOAL.w);
        iCol = Math.floor(iCol);
        if(iCol > NUM_AREA_GOAL.w-1){
            iCol = NUM_AREA_GOAL.w-1;
        }else if(iCol < 0) {
            iCol = 0;
        }

        var iRow = linearFunction(oPos.y, iStartY, iStartY+_pGoalSize.h, 0, NUM_AREA_GOAL.h);
        iRow = Math.floor(iRow);
        if(iRow > NUM_AREA_GOAL.h-1){
            iRow = NUM_AREA_GOAL.h-1;
        }else if(iRow < 0) {
            iRow = 0;
        }


        _iArea = iRow*NUM_AREA_GOAL.w + iCol;


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
        _oScene.setElementVelocity(oBallBody, {x: 0, y: 0, z: 0});
        _oScene.setElementAngularVelocity(oBallBody, {x: 0, y: 0, z: 0});

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

        createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting), y: Math.round(Math.random() * yShifting)}, iTime).call(function () {
            createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.8), y: -Math.round(Math.random() * yShifting * 0.8)}, iTime).call(function () {
                createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.6), y: Math.round(Math.random() * yShifting * 0.6)}, iTime).call(function () {
                    createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.4), y: -Math.round(Math.random() * yShifting * 0.4)}, iTime).call(function () {
                        createjs.Tween.get(_oContainerGame).to({x: Math.round(Math.random() * xShifting * 0.2), y: Math.round(Math.random() * yShifting * 0.2)}, iTime).call(function () {
                            createjs.Tween.get(_oContainerGame).to({y: 0, x: 0}, iTime)
                        });
                    });
                });
            });
        });
    };

    this.resetScene = function () {
        _bGoal = false;
        _bBallOut = false;
        _bSaved = false;
        _bMakeGoal = false;
        _bPoleCollide = false;
        _bFieldCollide = false;
        _bMpResultReceived = false;  // reset server-result gate for next round
        _iPrecomputedGkAnim = -1;   // clear synced GK anim
        _bAnimGoalKeeper = false;
        _oGoalKeeper.setAlpha(0);
        _oGoalKeeper.fadeAnimation(1);
        _oGoalKeeper.runAnim(IDLE);
        this.resetBallPosition();
        this.sortDepth(_oBall, _oGoal);
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
            if (oPos.y > BALL_OUT_Y || oPos.x > BACK_WALL_GOAL_SIZE.width || oPos.x < -BACK_WALL_GOAL_SIZE.width) {
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
            this.addImpulseToBall({x: _vHitDir.x,
                y: _vHitDir.y, z: _vHitDir.z});
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
                    _oGoalKeeper.viewFrame(_oGoalKeeper.getAnimArray(), _oGoalKeeper.getAnimArray().length - 1);
                    _oGoalKeeper.hideFrame(_oGoalKeeper.getAnimArray(), 0);
                    _oGoalKeeper.fadeAnimation(0);
                }
            }
        } else if (!_bAnimPlayer) {
            // Only run idle GK update when player is NOT animating (pre-kick idle state)
            _oGoalKeeper.update();
        }
    };

    this.resetPoleCollision = function () {
        if (_bMultiplayerMode) { return; }
        if (_fTimePoleReset > 0) {
            _fTimePoleReset -= s_iTimeElaps;
        } else {
            if (!_bGoal || !_bSaved) {
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
        if (!_bIsMyTurn) {
            if (_oHandSwipeAnim) { _oHandSwipeAnim.setVisible(false); }
            return;
        }
        if (_oHandSwipeAnim.isAnimate() || _bLaunched) {
            return;
        }
        if (_fTimeSwipe > 0) {
            _fTimeSwipe -= s_iTimeElaps;
        } else {
            _oHandSwipeAnim.animAllSwipe();
            _oHandSwipeAnim.setVisible(true);
            _fTimeSwipe = MS_TIME_SWIPE_START;
        }
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
        _sMyPlayerId      = oStartData.myPlayerId;
        _iP1Score         = 0;
        _iP2Score         = 0;
        _iP1Shots         = 0;
        _iP2Shots         = 0;
        _bGameOver        = false;

        _bIsMyTurn    = (oStartData.firstKickerId === _sMyPlayerId);
        _sCurrentTurn = _bIsMyTurn ? 'mine' : 'theirs';

        // Resolve opponent name from player list
        var oppName = 'Opponent';
        if (oStartData.players) {
            for (var i = 0; i < oStartData.players.length; i++) {
                if (oStartData.players[i].playerId !== _sMyPlayerId) {
                    oppName = oStartData.players[i].name;
                    break;
                }
            }
        }

        var myName = (s_oMultiplayer && s_oMultiplayer.getMyName) ? s_oMultiplayer.getMyName() : 'You';
        this._createMpHUD(myName, oppName);

        // Wire CMultiplayer callbacks to our handlers
        var self = this;
        s_oMultiplayer.onRoundResult  = function (data) { self.onMpRoundResult(data); };
        s_oMultiplayer.onGameEnd      = function (data) { self._mpEndGame(data); };
        s_oMultiplayer.onOpponentLeft = function ()     { self._mpOpponentLeft(); };
        s_oMultiplayer.onTimerTick    = function (t)    { self._mpTimerTick(t); };
        s_oMultiplayer.onTurnTimeout  = function ()     { self._mpTimerOut(); };

        this._updateTurnState();
    };

    // â”€â”€ Create in-canvas HUD elements for multiplayer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._createMpHUD = function (szMyName, szOppName) {
        _sMpMyName  = szMyName  || 'You';
        _sMpOppName = szOppName || 'Opp';

        // Turn / status banner at top-center
        _oTurnText            = new createjs.Text('', '28px ' + FONT_GAME, '#ffffff');
        _oTurnText.textAlign  = 'center';
        _oTurnText.x          = CANVAS_WIDTH_HALF;
        _oTurnText.y          = 12;
        _oTurnText.shadow     = new createjs.Shadow('#000000', 1, 1, 4);
        s_oStage.addChild(_oTurnText);

        // Timer countdown
        _oTimerText           = new createjs.Text('', '22px ' + FONT_GAME, '#ffcc00');
        _oTimerText.textAlign = 'center';
        _oTimerText.x         = CANVAS_WIDTH_HALF;
        _oTimerText.y         = 46;
        _oTimerText.shadow    = new createjs.Shadow('#000000', 1, 1, 3);
        s_oStage.addChild(_oTimerText);

        // Score display showing BOTH players â€” always visible on both screens
        _oMpScoreText           = new createjs.Text(_sMpMyName + ' 0  \u2014  ' + _sMpOppName + ' 0', '26px ' + FONT_GAME, '#ffffff');
        _oMpScoreText.textAlign = 'center';
        _oMpScoreText.x         = CANVAS_WIDTH_HALF;
        _oMpScoreText.y         = 78;
        _oMpScoreText.shadow    = new createjs.Shadow('#000000', 1, 1, 3);
        s_oStage.addChild(_oMpScoreText);
    };

    // â”€â”€ Update turn state (enable/disable input, timer, HUD text) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._updateTurnState = function () {
        if (_bGameOver) return;
        if (_bIsMyTurn) {
            if (_oTurnText)  { _oTurnText.text  = '\u26BD YOUR TURN';   _oTurnText.color  = '#ffffff'; }
            if (_oTimerText) { _oTimerText.text  = '15s';               _oTimerText.color = '#ffcc00'; }
            this._enableInput();
            if (_oHandSwipeAnim) { _oHandSwipeAnim.setVisible(true); }
            if (s_oMultiplayer && s_oMultiplayer.startTimer) { s_oMultiplayer.startTimer(); }
        } else {
            if (_oTurnText)  { _oTurnText.text  = "Opponent's Turn";   _oTurnText.color  = '#aaaaaa'; }
            if (_oTimerText) { _oTimerText.text  = ''; }
            this._disableInput();
            if (_oHandSwipeAnim) { _oHandSwipeAnim.setVisible(false); }
            if (s_oMultiplayer && s_oMultiplayer.stopTimer) { s_oMultiplayer.stopTimer(); }
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
        if (_oTimerText) {
            _oTimerText.text  = t + 's';
            _oTimerText.color = (t <= 5) ? '#ff4444' : '#ffcc00';
        }
    };
    this._mpTimerOut = function () {
        if (_bGameOver) return;
        // Immediately lock input - no late kicks allowed
        this._disableInput();
        // Show TIME! banner
        _oInterface.createAnimText('TIME!', 80, false, '#ff4444', '#000000');
        // Auto-send kick to server so it resolves the round and advances the turn
        if (s_oMultiplayer && s_oMultiplayer.sendTurnTimeout) {
            s_oMultiplayer.sendTurnTimeout();
        }
    };

    // â”€â”€ ROUND_RESULT handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.onMpRoundResult = function (data) {
        if (_bGameOver) return;

        var bIWasKicker = (data.kickerId === _sMyPlayerId);
        if (bIWasKicker) { _iP1Shots++; } else { _iP2Shots++; }

        // ── Mark that server result has arrived — unblock areaGoal() ──
        _bMpResultReceived = true;

        // ── Store server-authoritative GK anim index (syncs both screens) ──
        _iPrecomputedGkAnim = (data.gkAnimIndex !== undefined) ? data.gkAnimIndex : -1;

        // ── Server-authoritative score lookup ──
        var oppId    = (_sMyPlayerId === 0) ? 1 : 0;
        var myGoals  = 0;
        var oppGoals = 0;
        if (data.scores) {
            myGoals  = (data.scores[_sMyPlayerId]  !== undefined) ? data.scores[_sMyPlayerId]  : (data.scores[String(_sMyPlayerId)]  || 0);
            oppGoals = (data.scores[oppId]          !== undefined) ? data.scores[oppId]          : (data.scores[String(oppId)]          || 0);
        }

        var self = this;

        if (bIWasKicker) {
            // ── I WAS THE KICKER ──
            // Ball is already flying on my screen. Apply server-authoritative result:
            // 1) Force the correct GK anim (server decided), overriding what was played locally
            if (_bLaunched && _iPrecomputedGkAnim !== -1) {
                var pBallFinalPos = self.predictBallGoalPos(_vHitDir);
                if (data.scored) {
                    // GK dives wrong way — use runAnim (no position shift)
                    _oGoalKeeper.runAnim(_iPrecomputedGkAnim);
                } else {
                    // GK saves — shift to ball position
                    _oGoalKeeper.runAnimAndShift(_iPrecomputedGkAnim, pBallFinalPos);
                }
                _bAnimGoalKeeper = true;
            }
            // 2) Apply result from server
            _bMakeGoal = data.scored;
            if (data.scored) {
                if (!_bGoal) {
                    _bGoal = true;
                    _fTimeReset = TIME_RESET_AFTER_GOAL;
                    self.textGoal();
                    playSound('goal', 1, false);
                }
            } else {
                if (!_bSaved) {
                    setTimeout(function () {
                        if (!_bSaved) {
                            _bSaved = true;
                            self._mpSaveBall();
                        }
                    }, 600);
                }
            }
        } else {
            // -- OPPONENT WAS THE KICKER - replay their kick on my screen --
            this._replayOpponentKick(data);
            if (!data.scored) {
                setTimeout(function () {
                    if (!_bSaved) {
                        _bSaved = true;
                        self._mpSaveBall();
                    }
                }, 600);
            }
        }

        // Update score HUD on both screens
        this._updateMpHUD(myGoals, oppGoals);

        if (data.gameOver) {
            this._mpEndGame(data);
            return;
        }

        // Prepare next turn
        _bIsMyTurn    = (data.nextKickerId === _sMyPlayerId);
        _sCurrentTurn = _bIsMyTurn ? 'mine' : 'theirs';

        setTimeout(function () {
            self.resetScene();
            _bLaunched  = false;
            _fTimeSwipe = MS_TIME_SWIPE_START;
            self._updateTurnState();
        }, 2500);
    };

    // â”€â”€ Replay opponent kick using echoed physics data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // -- Realistic ball deflection when GK saves in multiplayer --
    // Called 600ms after ROUND_RESULT so ball has traveled realistically before being stopped.
    this._mpSaveBall = function () {
        // Show SAVED feedback
        _fTimeReset = TIME_RESET_AFTER_SAVE;
        _oInterface.createAnimText(TEXT_SAVED, 80, false, TEXT_COLOR_1, TEXT_COLOR_STROKE);
        playSound('ball_saved', 1, false);

        // Apply realistic deflection:
        //   Y is toward goal (+). Reverse so ball bounces BACK toward player.
        //   X is left/right. Keep small fraction for natural wobble.
        //   Z is vertical (+up). Add slight upward arc (GK punch effect).
        var oBallBody = _oScene.ballBody();
        var vY = oBallBody.velocity.y;   // forward speed (positive = toward goal)
        var vX = oBallBody.velocity.x;   // sideways speed

        // GK absorbs ~60% of energy, bounces back ~40%
        var fBackSpeed = Math.max(Math.abs(vY) * 0.40, 5);
        var fSideSpeed = vX * 0.25 + (Math.random() - 0.5) * 4;
        var fUpSpeed   = 3 + Math.random() * 4;   // upward pop (GK punch)

        _oScene.setElementVelocity(oBallBody, {
            x: fSideSpeed,
            y: -fBackSpeed,   // negative Y = back toward player
            z: fUpSpeed       // positive Z = upward
        });
        // Small spin to make the ball look naturally deflected
        _oScene.setElementAngularVelocity(oBallBody, {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
            z: 0
        });
    };

    this._replayOpponentKick = function (data) {
        var kd = data.kickData || {};

        // Ensure the ball is in start position (in case previous round left it mid-air)
        this.resetBallPosition();

        // Set kick direction from server echo
        _vHitDir.set(
            (kd.angle   !== undefined) ? kd.angle   : 0,
            (kd.power   !== undefined) ? kd.power   : 15,
            (kd.targetY !== undefined) ? kd.targetY : 0
        );
        this.calculateAreaGoal(_vHitDir);

        // Server is authoritative: use data.scored directly
        _bMakeGoal   = data.scored;
        _bLaunched   = false;

        // Trigger player kick animation; addImpulseToBall fires on SHOOT_FRAME
        _bAnimPlayer = true;
        _oPlayer.setVisible(true);
    };

    // â”€â”€ Update the multiplayer score HUD (shown on both screens) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._updateMpHUD = function (myGoals, oppGoals) {
        if (_oMpScoreText) {
            _oMpScoreText.text = _sMpMyName + ' ' + myGoals + '  \u2014  ' + _sMpOppName + ' ' + oppGoals;
        }
        // Also update the bottom scoreboard row
        if (_oInterface && _oInterface.refreshMultiplayerScore) {
            _oInterface.refreshMultiplayerScore(myGoals, oppGoals, _sMpMyName, _sMpOppName);
        }
    };

    // â”€â”€ Game over â€” show result as in-canvas text, no overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this._mpEndGame = function (data) {
        if (_bGameOver) return;
        _bGameOver = true;
        if (s_oMultiplayer && s_oMultiplayer.stopTimer) { s_oMultiplayer.stopTimer(); }

        var myGoals  = 0;
        var oppGoals = 0;
        if (data.scores) {
            for (var pid in data.scores) {
                // eslint-disable-next-line eqeqeq
                if (pid == _sMyPlayerId) {
                    myGoals  = data.scores[pid];
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
        } else {
            // Fallback: if server didn't send winnerId, decide by goal count
            sResult = (myGoals > oppGoals) ? 'win' : 'lose';
        }

        // HUD banner text
        var sHudText  = (sResult === 'win') ? 'You Win' : (sResult === 'lose') ? 'You Lose' : 'Match Tie';
        var sHudColor = (sResult === 'win') ? '#FFD700' : (sResult === 'lose') ? '#ff4444'   : '#aaddff';

        if (_oTurnText)  { _oTurnText.text  = sHudText;  _oTurnText.color  = sHudColor; }
        if (_oTimerText) {
            _oTimerText.text  = _sMpMyName + ' ' + myGoals + ' -- ' + _sMpOppName + ' ' + oppGoals;
            _oTimerText.color = '#ffffff';
        }

        _oInterface.createAnimText(sHudText, 80, false, sHudColor, '#000000');

        // Build ranked leaderboard (sorted by goals desc, unless draw)
        var aPlayers = [
            { name: _sMpMyName,  goals: myGoals,  isMe: true  },
            { name: _sMpOppName, goals: oppGoals, isMe: false }
        ];
        if (!data.draw) {
            aPlayers.sort(function (a, b) { return b.goals - a.goals; });
        }
        aPlayers[0].rank = 1;
        aPlayers[1].rank = 2;

        var self = this;
        setTimeout(function () {
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
        if (_oTurnText) { _oTurnText.text = 'Opponent Left'; _oTurnText.color = '#aaaaaa'; }
        _oInterface.createAnimText('You Win', 70, false, '#FFD700', '#000000');
        var aPlayers = [
            { rank: 1, name: _sMpMyName,             goals: _iP1Score, isMe: true  },
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
    this.isMultiplayer  = function () { return _bMultiplayerMode; };
    this.getCurrentTurn = function () { return _sCurrentTurn; };
    this.getTimeLeft    = function () { return _iTimeLeft; };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // END MULTIPLAYER METHODS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    s_oGame = this;

    AREAS_INFO        = oData.area_goal;
    NUM_OF_PENALTY    = oData.num_of_penalty;
    MULTIPLIER_STEP   = oData.multiplier_step;
    NUM_LEVEL_FOR_ADS = oData.num_levels_for_ads;

    this._init();
};

var s_oGame;
