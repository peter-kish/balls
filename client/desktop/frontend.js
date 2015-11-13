var FE = (function () {
    // Private

    var CHAT_HIDE_TIME = 15000;
    // var activeMenu = "main"; // main, host, join, game

    var gameFrame = {
    	width: 480,
    	height: 800
    }

    function getSafeString(s) {
        var lt = /</g,
        gt = />/g,
        ap = /'/g,
        ic = /"/g;
        return s.replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;");
    }

    function scrollToBottom(id) {
        var element = document.getElementById(id);
        element.scrollTop = element.scrollHeight;
    }

    function onAuthentication() {
      var name = $('#input_name').val();
      $('#screen_main').hide();
      $('#main_connected').show();
      $('#set_name').val(name);
    }

    function onAuthFailed() {
      $("#error_login").text("Name already taken! Enter a different one");
    }

    function refreshClientList(clientList) {
        var select = document.getElementById("list_join_clients");
        while (select.length > 0) {
    		select.remove(0);
    	}
    	for (var i = 0; i < clientList.length; i++) {
            if (clientList[i].state == "hosting") {
        		var option = document.createElement("option");
        		option.text = getSafeString(clientList[i].name);
                option.value = clientList[i].id;
        		select.add(option);
            }
    	}

        var playersTable = document.getElementById("table_main_players");
        while (playersTable.rows.length > 0) {
            playersTable.deleteRow(0);
        }
        for (var i = 0; i < clientList.length; i++) {
            var row = playersTable.insertRow(playersTable.rows.length);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            cell1.innerHTML = "(" + (i+1) + ")";
            cell2.innerHTML = getSafeString(clientList[i].name);
            cell3.innerHTML = "[" + clientList[i].state + "]";
        }
    }

    function startGame(id1, id2) {
        SIMR.stop();
        SIMR.start(document.getElementById("game_canvas"));
        resizeCanvas();
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

    function adjustChatbox() {
        var chatDiv = document.getElementById("game_chat_container");
        var canvas = document.getElementById("game_canvas");
        while (chatDiv.offsetHeight > canvas.offsetHeight) {
            chatDiv.removeChild(chatDiv.childNodes[0]);
        }
    }

    function addMessageSpan(divId, message) {
        var chatDiv = document.getElementById(divId);
        if (chatDiv.innerHTML != "")
            chatDiv.innerHTML += "\n"
        chatDiv.innerHTML += message;
    }

    var chatIntervalHandle = null;
    function displayInfoMessage(message) {
        if ($('#game_chat_container:visible').length) {
            addMessageSpan("game_chat_container", message);
        } else {
            addMessageSpan("main_chat_container", message);
            scrollToBottom("main_chat_container");
        }
    }

    function displayChatMessage(name, message) {
        var message = "[" + getSafeString(name) + "]: " + getSafeString(message);
        displayInfoMessage(message);
    }

    function resizeCanvas() {
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

        var chat = document.getElementById("game_chat_container");
        chat.style.maxWidth = CDRAW.getScale() * gameFrame.width + "px";
    }

    function onWindowResize(e) {
        resizeCanvas();
        adjustChatbox();
    }

    // Public

    var module = {};

    module.onPageLoad = function() {
        module.mainMenu();
        CL.connect();
        CL.onClientListChanged = refreshClientList;
        CL.onGameStarted = startGame;
        CL.onChatMessage = displayChatMessage;
        CL.onInfoMessage = displayInfoMessage;
        var canvas = document.getElementById("game_input_area");
        canvas.addEventListener('mousemove', canvasMouseMove);
        canvas.addEventListener('mousedown', canvasMouseDown);
        canvas.addEventListener('mouseup', canvasMouseUp);
        canvas.addEventListener('touchmove', canvasTouchMove);
        canvas.addEventListener('touchstart', canvasTouchDown);
        canvas.addEventListener('touchend', canvasTouchUp);
        window.onresize = onWindowResize;
    }

    module.setName = function(name) {
        if (CL.authenticated) {
            CL.changeName(name);
            return;
        }
        if (CL.connected) {
            CL.requestAuthentication(name, onAuthentication, onAuthFailed);
        }
    }

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
        CL.join(hostID);
    }

    module.joinBot = function() {
        CL.joinBot();
    }

    module.mainMenu = function() {
        SIMR.stop();
        CL.idle();
    }

    module.sendChatMessage = function(message) {
      CL.chat(message);
    }

    return module;
}(CL, SIMR));
