var SIMR = (function () {
    CL.onTurnStart = onTurnStart;
    // Private
    var animationFrameRequest = null;
    // Constants
    var playerColor = [];
    var playerOutlineColor = [];
    playerColor[0] = '#4486f6'
    playerColor[1] = '#d84a38'
    playerOutlineColor[0] = '#0197fd'
    playerOutlineColor[1] = '#fd3301'
    var goalPostColor = '#888888';
    var goalPostRadius = 15;
    var goalSize = 200;
    var notificationFader = new FADER.Fader();
    var notificationFadeTime = 2000;
    var notificationMessage = "";
    var markerTime = 400; // ms

    var playfieldBorder = 100;
    var cameraSpeed = 4;

    var MAX_STRENGTH_DISTANCE = 250;

    var gameFrame = {
    	width: 480,
    	height: 800
    }

    var mouse = new V2D.Vector2d(0, 0);
    var canvasMouse = new V2D.Vector2d(0, 0);
    var mouseDown = false;
    var playerName = [];
    var strength = 0.0;
    var markerFader = new FADER.Fader();
    var markerSign = 1;
    var camera = new V2D.Vector2d(0, 0);

    function createSprite(image) {
        var sprite = {};
        sprite.image = image;
        sprite.position = new V2D.Vector2d(0, 0);
        sprite.origin = new V2D.Vector2d(0, 0);
        sprite.draw = function() {
            CDRAW.drawImage(image, sprite.position.x - sprite.origin.x, sprite.position.y - sprite.origin.y);
        };
        return sprite;
    }

    function createTitle(text) {
        var title = {};
        title.text = text;
        title.position = new V2D.Vector2d(0, 0);
        title.alpha = 1;
        title.backgroundAlpha = 1;
        title.color = '#000000';
        title.backgroundColor = '#FFFFFF';
        title.background = false;
        title.size = 18;
        title.draw = function() {
            var tw = CDRAW.getTextWidth(title.text, "Calibri", title.size, '#FFFFFF', "bold", "center", "middle") + 12;
            var th = 18 + 6
            if (title.background) {
                CDRAW.setAlpha(title.backgroundAlpha);
                CDRAW.drawRect(title.position.x - tw/2, title.position.y - th/2, tw, th, title.backgroundColor);
            }
            CDRAW.setAlpha(title.alpha);
            CDRAW.drawText(title.position.x, title.position.y, title.text, "Calibri", title.size, title.color, "bold", "center", "middle");
            CDRAW.setAlpha(1);
        }
        return title;
    }

    var sprRedBall = createSprite(CDRAW.loadImage("ball_red.svg"));
    var sprBlueBall = createSprite(CDRAW.loadImage("ball_blue.svg"));
    var sprWhiteBall = createSprite(CDRAW.loadImage("ball_white.svg"));
    var sprPlayfield = createSprite(CDRAW.loadImage("playfield.svg"));

    var playerTitle = [];
    playerTitle[0] = createTitle("Player1");
    playerTitle[1] = createTitle("Player2");
    for (var i = 0; i < playerTitle.length; i++) {
        playerTitle[i].color = '#FFFFFF';
        playerTitle[i].background = true;
        playerTitle[i].backgroundColor = '#000000';
        playerTitle[i].backgroundAlpha = 0.3;
    }

    var playerScoreTitle = [];
    playerScoreTitle[0] = createTitle("0");
    playerScoreTitle[1] = createTitle("0");
    playerScoreTitle[0].position.set(new V2D.Vector2d(gameFrame.width/2, gameFrame.height - 120))
    playerScoreTitle[1].position.set(new V2D.Vector2d(gameFrame.width/2, 120))
    for (var i = 0; i < playerScoreTitle.length; i++) {
        playerScoreTitle[i].color = playerColor[i];
        playerScoreTitle[i].alpha = 0.5;
        playerScoreTitle[i].size = 128;
    }

    var notificationTitle = createTitle("");
    notificationTitle.position.set(new V2D.Vector2d(gameFrame.width/2, gameFrame.height/2));
    notificationTitle.size = 32;

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

    function getMarkedBall() {
        if (CL.simulation.playerBall[0].marked) {
            return CL.simulation.playerBall[0];
        }
        return CL.simulation.playerBall[1];
    }

    function getMarkedPlayer() {
        if (CL.simulation.playerBall[0].marked) {
            return 0;
        }
        return 1;
    }

    initAnimationFrame();

    function drawFrame() {
        animationFrameRequest = requestAnimationFrame(drawFrame);

        render();
    }

    function clearScreen() {
        CDRAW.drawRect(0, 0, gameFrame.width, gameFrame.height, goalPostColor);
    }

    function drawAim() {
        var markedBall = getMarkedBall();
        if (mouseDown && markedBall.id == CL.clientId && CL.simulation.areAllBallsIdle()) {
            var target = new V2D.Vector2d(mouse.x, mouse.y);
            if (target.distance(markedBall.position) > MAX_STRENGTH_DISTANCE) {
                target = V2D.sub(mouse, markedBall.position);
                target.normalize();
                target.multiply(MAX_STRENGTH_DISTANCE);
                target.add(markedBall.position);
            }
            CDRAW.setAlpha(0.25);
            CDRAW.setLineCap("round");
            CDRAW.drawLine(markedBall.position.x, markedBall.position.y, target.x, target.y, markedBall.radius * 2, CDRAW.rgb(1.0 - strength, strength, 0));
            CDRAW.setAlpha(1.0);
            CDRAW.setLineCap("butt");
        }
    }

    function drawBallMarker() {
        var markedBall = getMarkedBall();
        if (CL.simulation.areAllBallsIdle()) {
            if (markerFader.isTimeUp()) {
                markerFader.start(markerTime);
                markerSign *= -1;
            }
            var alpha = markerFader.getProgress();
            if (markerSign < 0) {
                alpha = 1.0 - alpha;
            }
            CDRAW.drawCircleOutline(markedBall.position.x, markedBall.position.y, markedBall.radius + 6 * alpha, 6, playerOutlineColor[getMarkedPlayer()]);
        }
    }

    function setDrawablesParams(simulation) {
        sprRedBall.position.set(simulation.playerBall[1].position);
        sprRedBall.origin.set(new V2D.Vector2d(simulation.playerBall[1].radius, simulation.playerBall[1].radius));
        sprBlueBall.position.set(simulation.playerBall[0].position);
        sprBlueBall.origin.set(new V2D.Vector2d(simulation.playerBall[0].radius, simulation.playerBall[0].radius));
        sprWhiteBall.position.set(simulation.playBall.position);
        sprWhiteBall.origin.set(new V2D.Vector2d(simulation.playBall.radius, simulation.playBall.radius));

        playerTitle[0].position.set(simulation.playerBall[0].position);
        playerTitle[0].text = playerName[0];
        playerTitle[1].position.set(simulation.playerBall[1].position);
        playerTitle[1].text = playerName[1];

        playerScoreTitle[0].text = simulation.playerScore[0];
        playerScoreTitle[1].text = simulation.playerScore[1];

        notificationTitle.text = notificationMessage;
    }

    function moveCamera(simulation) {
        if (mouseDown && simulation.areAllBallsIdle()) {
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
    }

    function render() {
        clearScreen();
        CL.simulation.update();
        setDrawablesParams(CL.simulation)
        moveCamera(CL.simulation);

        CDRAW.setOrigin(-camera.x, -camera.y);

        // Draw the playfield
        sprPlayfield.draw();

        // Draw the score
        playerScoreTitle[0].draw();
        playerScoreTitle[1].draw();

        /// Draw the aim
        drawAim();

        // Draw the ball marker
        drawBallMarker();

        // Draw the balls
        sprRedBall.draw();
        sprBlueBall.draw();
        sprWhiteBall.draw();

        // Draw player names
        playerTitle[0].draw();
        playerTitle[1].draw();

        // Draw notifications
        if (!notificationFader.isTimeUp()) {
            notificationTitle.alpha = 1.0 - notificationFader.getProgress();
            notificationTitle.draw();
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
        mouse.add(camera);
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
        if (CL.simulation) {
            var currentPlayerPos = CL.simulation.playerBall[CL.simulation.currentTurn].position;
            var dragDistance = V2D.distance(currentPlayerPos, mouse);
            var strength = dragDistance;
            strength = Math.min(MAX_STRENGTH_DISTANCE, strength);
            strength /= MAX_STRENGTH_DISTANCE;
            return strength;
        }
    }

    return module;
}(CL, CDRAW));
