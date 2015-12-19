var FE = (function () {
    // Private

    var CHAT_HIDE_TIME = 15000;

    var gameFrame = {
    	width: 480,
    	height: 800
    }

    function onConnected() {
        PAINTER.enableConnection();
    }

    function onAuthentication() {
        PAINTER.setPlayerName();
    }

    function onAuthFailed(reason) {
        PAINTER.displayErrorMessage(reason);
        PAINTER.enableConnection();
    }

    function onServerError(message) {
        PAINTER.displayErrorMessage(message);
    }

    function onOpponentLeft(opponentId) {
        PAINTER.endGame(CL.getClientName(opponentId) + " has left the match!");
    }

    function refreshClientList(clientList) {
        PAINTER.repaintClientsLists(clientList);
    }

    function startGame(id1, id2) {
        SIMR.stop();
        PAINTER.startGame();
        SIMR.start(document.getElementById("game_canvas"));
        resizeCanvas();

        if (PAINTER.playSoundChecked()) {
            console.log("playing sound");
            var snd = new Audio("whisle.mp3");
            snd.play();
        }
    }

    function getMouseCoords(event, element) {
        var result = {};
        var rect = element.getBoundingClientRect();
        result.x = event.pageX - rect.left;
        result.y = event.pageY - rect.top;
        result.x /= CDRAW.getScale();
        result.y /= CDRAW.getScale();
        return result;
    }

    function canvasMouseMove(e) {
        var mouse = getMouseCoords(e, this);
        SIMR.setMouse(mouse);
    }

    function canvasMouseDown(e) {
        var mouse = getMouseCoords(e, this);
        SIMR.setMouse(mouse);
        SIMR.setMouseDownState(true);
    }

    function canvasMouseUp(e) {
        var mouse = getMouseCoords(e, this);
        CL.playTurn(SIMR.getMouse().x, SIMR.getMouse().y, SIMR.getStrength(mouse));
        SIMR.setMouseDownState(false);
        SIMR.setMouse(mouse);
    }

    function getTouchCoords(event, element) {
        var touchobj = event.changedTouches[0];
        var result = {};
        var rect = element.getBoundingClientRect();
        result.x = touchobj.clientX - rect.left;
        result.y = touchobj.clientY - rect.top;
        result.x /= CDRAW.getScale();
        result.y /= CDRAW.getScale();
        return result;
    }

    function canvasTouchMove(e) {
        var touch = getTouchCoords(e, this);
        SIMR.setMouse(touch);
        e.preventDefault()
    }

    function canvasTouchDown(e) {
        var touch = getTouchCoords(e, this);
        SIMR.setMouse(touch);
        SIMR.setMouseDownState(true);
        e.preventDefault();
    }

    function canvasTouchUp(e) {
        var touch = getTouchCoords(e, this);
        CL.playTurn(SIMR.getMouse().x, SIMR.getMouse().y, SIMR.getStrength(touch));
        SIMR.setMouseDownState(false);
        SIMR.setMouse(touch);
        e.preventDefault();
    }

    function displayInfoMessage(message) {
        PAINTER.printMessage(null, message);
    }

    function displayChatMessage(name, message) {
        PAINTER.printMessage(name, message);
    }

    function displayLocalChatMessage(name, message) {
        PAINTER.printLocalMessage(name, message);
    }

    function displayVictoryDialog(id) {
        PAINTER.endGame(CL.getClientName(id) + " has won the match!");
    }

    function resizeCanvas() {
        if ($("#screen_game:visible").length > 0) {
            var canvas = document.getElementById("game_canvas");
            var container = document.getElementById("game_canvas_container");
            var input = document.getElementById("game_input_area");
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            if (canvas.width / canvas.height > gameFrame.width / gameFrame.height) {
            	CDRAW.setScale(canvas.height / gameFrame.height);
            } else {
            	CDRAW.setScale(canvas.width / gameFrame.width);
            }
            canvas.width = CDRAW.getScale() * gameFrame.width;
            canvas.height = CDRAW.getScale() * gameFrame.height;
        }
    }

    function onWindowResize(e) {
        resizeCanvas();
    }

    // Public

    var module = {};

    module.onPageLoad = function() {
        module.mainMenu();
        CL.connect(onConnected);
        CL.onClientListChanged = refreshClientList;
        CL.onGameStarted = startGame;
        CL.onChatMessage = displayChatMessage;
        CL.onLocalChatMessage = displayLocalChatMessage;
        CL.onInfoMessage = displayInfoMessage;
        CL.onVictory = displayVictoryDialog;
        CL.onOpponentLeft = onOpponentLeft;
        CL.onServerError = onServerError;
        var canvas = document.getElementById("game_input_area");
        canvas.addEventListener('mousemove', canvasMouseMove);
        canvas.addEventListener('mousedown', canvasMouseDown);
        canvas.addEventListener('mouseup', canvasMouseUp);
        canvas.addEventListener('touchmove', canvasTouchMove);
        canvas.addEventListener('touchstart', canvasTouchDown);
        canvas.addEventListener('touchend', canvasTouchUp);
        window.onresize = onWindowResize;
    }

    module.requestAuthentication = function(name) {
        if (CL.connected) {
            CL.requestAuthentication(name, onAuthentication, onAuthFailed);
        }
    }

    module.setName = function(name) {
        if (CL.authenticated) {
            CL.changeName(name);
            return;
        }
    }

// FIND appropriate names for following functions

    module.hostMenu = function() {
        if (CL.clientState == "idle") {
            CL.host();
            return true;
        } else if (CL.clientState == "hosting") {
            CL.idle();
            return false;
        }
    }

    module.joinMenu = function() {
        SIMR.stop();
        refreshClientList(CL.getClientList());
    }

    module.joinRefresh = function() {
        refreshClientList(CL.getClientList());
    }

    module.joinClient = function(hostId) {
        CL.join(hostId);
    }

    module.joinBot = function() {
        CL.joinBot();
    }

    module.mainMenu = function() {
        SIMR.stop();
        CL.idle();
    }

    module.sendChatMessage = function(message, local) {
        CL.chat(message, local);
    }

// FIND appropriate names for following functions END

    return module;
}(CL, SIMR, PAINTER));
