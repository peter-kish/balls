var SIMR = (function () {
    CL.onTurnStart = onTurnStart;
    // Private
    var animationFrameRequest = null;
    // Constants
    var textColor = '#CCCCCC'
    var playerColor = [];
    var playerOutlineColor = [];
    playerColor[0] = '#4486f6'
    playerColor[1] = '#d84a38'
    playerOutlineColor[0] = '#225ec3'
    playerOutlineColor[1] = '#b32e1d'
    var ballColor = '#FFFFFF';
    var ballOutlineColor = '#6e6e6e';
    var goalPostColor = '#6e6e6e';
    var grassColor = '#f1f1f1';
    var nameColor = '#000000';
    var linesColor = '#d7d7d7';
    var goalPostRadius = 10;
    var goalSize = 200;
    var notificationFader = new FADER.Fader();
    var notificationFadeTime = 2000;
    var notificationMessage = "";
    var markerTime = 400; // ms

    var playfieldBorder = 100;
    var cameraSpeed = 4;

    var MAX_STRENGTH_DISTANCE = 200;

    var gameFrame = {
    	width: 480,
    	height: 640
    }

    var mouse = new V2D.Vector2d(0, 0);
    var canvasMouse = new V2D.Vector2d(0, 0);
    var mouseDown = false;
    var playerName = [];
    var strength = 0.0;
    var markerFader = new FADER.Fader();
    var markerSign = 1;
    var camera = new V2D.Vector2d(0, 0);

    function initAnimationFrame() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                       || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }

    initAnimationFrame();

    function drawFrame() {
        animationFrameRequest = requestAnimationFrame(drawFrame);

        render();
    }

    function clearScreen() {
        CDRAW.drawRect(0, 0, gameFrame.width, gameFrame.height, grassColor);
    }

    function renderBall(ball, color, name, outlineColor) {
        if (!outlineColor) outlineColor = '#000000'
        if (mouseDown && ball.marked && ball.id == CL.clientId && CL.simulation.areAllBallsIdle()) {
            var target = new V2D.Vector2d(mouse.x, mouse.y);
            if (target.distance(ball.position) > MAX_STRENGTH_DISTANCE) {
                target = V2D.sub(mouse, ball.position);
                target.normalize();
                target.multiply(MAX_STRENGTH_DISTANCE);
                target.add(ball.position);
            }
            CDRAW.setAlpha(0.25);
            CDRAW.setLineCap("round");
            CDRAW.drawLine(ball.position.x, ball.position.y, target.x, target.y, ball.radius * 2, CDRAW.rgb(1.0 - strength, strength, 0));
            CDRAW.setAlpha(1.0);
            CDRAW.setLineCap("butt");
        }
    	CDRAW.drawCircle(ball.position.x, ball.position.y, ball.radius, color);
        if (ball.marked && CL.simulation.areAllBallsIdle()) {
            if (markerFader.isTimeUp()) {
                markerFader.start(markerTime);
                markerSign *= -1;
            }
            var alpha = markerFader.getProgress();
            if (markerSign < 0) {
                alpha = 1.0 - alpha;
            }
            CDRAW.drawCircleOutline(ball.position.x, ball.position.y, ball.radius + 6 * alpha, 6, outlineColor);
        }
        CDRAW.drawText(ball.position.x, ball.position.y, name, "Calibri", 12, nameColor, "bold", "center", "middle");
    }

    function render() {
        clearScreen();
        CL.simulation.update();

        if (mouseDown && CL.simulation.areAllBallsIdle()) {
            if (canvasMouse.x < playfieldBorder && camera.x > -gameFrame.width / 2) {
                camera.x -= cameraSpeed * ((playfieldBorder - canvasMouse.x) / playfieldBorder);
            } else if (canvasMouse.x > gameFrame.width - playfieldBorder && camera.x < gameFrame.width / 2) {
                camera.x += cameraSpeed * ((canvasMouse.x - gameFrame.width + playfieldBorder) / playfieldBorder);
            }
            if (canvasMouse.y < playfieldBorder && camera.y > -gameFrame.height / 2) {
                camera.y -= cameraSpeed * ((playfieldBorder - canvasMouse.y) / playfieldBorder);
            } else if (canvasMouse.y > gameFrame.height - playfieldBorder && camera.y < gameFrame.height / 2) {
                camera.y += cameraSpeed * ((canvasMouse.y - gameFrame.height + playfieldBorder) / playfieldBorder);
            }
        } else {
            camera.multiply(0.75);
            if (camera.length() < 0.1) {
                camera.x = 0;
                camera.y = 0;
            }
        }

        CDRAW.setOrigin(-camera.x, -camera.y);
        // Draw the goals
    	CDRAW.drawRect(gameFrame.width/2 - goalSize/2, gameFrame.height - goalPostRadius, goalSize, goalPostRadius, playerColor[0]);
    	CDRAW.drawRect(gameFrame.width/2 - goalSize/2, 0, goalSize, goalPostRadius, playerColor[1]);

        // Draw the lines
    	CDRAW.drawLine(0, gameFrame.height/2, gameFrame.width, gameFrame.height/2, 15, linesColor);
    	CDRAW.drawCircleOutline(gameFrame.width/2, gameFrame.height/2, 100, 15, linesColor);
    	CDRAW.drawCircle(gameFrame.width/2, gameFrame.height/2, 20, linesColor);

        // Draw the playfield border
        CDRAW.drawRectOutline(0, 0, gameFrame.width-1, gameFrame.height-1, 1, goalPostColor);

        // Draw the score
    	CDRAW.setAlpha(0.5);
    	CDRAW.drawText(gameFrame.width/2, 120, CL.simulation.playerScore[1], 'Calibri', 128, playerColor[1], 'bold', 'center', 'middle');
    	CDRAW.drawText(gameFrame.width/2, gameFrame.height - 120, CL.simulation.playerScore[0], 'Calibri', 128, playerColor[0], 'bold', 'center', 'middle');
    	CDRAW.setAlpha(1.0);

        for (var i = 0; i < CL.simulation.balls.length; i++) {
            if (CL.simulation.balls[i] != CL.simulation.playerBall[0] &&
                CL.simulation.balls[i] != CL.simulation.playerBall[1] &&
                CL.simulation.balls[i] != CL.simulation.playBall) {
                renderBall(CL.simulation.balls[i], goalPostColor, "");
            }
        }

        renderBall(CL.simulation.playerBall[0], playerColor[0], playerName[0], playerOutlineColor[0]);
        renderBall(CL.simulation.playerBall[1], playerColor[1], playerName[1], playerOutlineColor[1]);

        if (CL.simulation.playBall) {
            renderBall(CL.simulation.playBall, ballColor, "");
    		CDRAW.drawCircleOutline(CL.simulation.playBall.position.x,
                CL.simulation.playBall.position.y,
                CL.simulation.playBall.radius,
                3,
                ballOutlineColor);
    	}

        if (!notificationFader.isTimeUp()) {
            CDRAW.setAlpha(1.0 - notificationFader.getProgress());
            CDRAW.drawText(gameFrame.width/2, gameFrame.height/2, notificationMessage, 'Calibri', 32, '#000000', 'bold', 'center', 'middle');
            CDRAW.setAlpha(1.0);
        }
        CDRAW.resetOrigin();
        CDRAW.drawRectOutline(0, 0, gameFrame.width-1, gameFrame.height-1, 1, '#000000');
    }

    function onTurnStart(id) {
        console.log(CL.getClientName(id) + "'s turn");
        showNotification(CL.getClientName(id) + "'s turn");
        markerFader.start(markerTime);
        markerSign = 1;
    }

    function showNotification(message) {
        notificationFader.start(notificationFadeTime);
        notificationMessage = message;
    }

    // Public
    var module = {};

    module.start = function(canvas, name1, name2) {
        playerName[0] = CL.getClientName(CL.simulation.playerBall[0].id);
        playerName[1] = CL.getClientName(CL.simulation.playerBall[1].id);
        CDRAW.setCanvas(canvas);

        drawFrame();
    }

    module.stop = function() {
        cancelAnimationFrame(animationFrameRequest);
    }

    module.setMouse = function(m) {
        canvasMouse.x = m.x;
        canvasMouse.y = m.y;
        mouse.x = m.x;
        mouse.y = m.y;
        mouse.add(V2D.multiply(camera, 1/CDRAW.getDrawRatio()));
        strength = module.getStrength();
    }

    module.getMouse = function () {
        var result = {};
        result.x = mouse.x;
        result.y = mouse.y;
        return result;
    }

    module.setMouseDownState = function(state) {
        mouseDown = state;
    }

    module.getCamera = function() {
        var result = {};
        result.x = camera.x;
        result.y = camera.y;
        return result;
    }

    module.getStrength = function () {
        var currentPlayerPos = CL.simulation.playerBall[CL.simulation.currentTurn].position;
        var dragDistance = V2D.distance(currentPlayerPos, mouse);
        var strength = dragDistance;
        strength = Math.min(MAX_STRENGTH_DISTANCE, strength);
        strength /= MAX_STRENGTH_DISTANCE;
        return strength;
    }

    return module;
}(CL, CDRAW));
