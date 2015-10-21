var FE = (function () {
    // Private

    var CHAT_HIDE_TIME = 15000;
    var MAX_STRENGTH_DISTANCE = 200;

    var gameFrame = {
    	width: 480,
    	height: 640
    }

    function getSafeString(s) {
        var lt = /</g,
        gt = />/g,
        ap = /'/g,
        ic = /"/g;
        return s.replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;");
    }

    function showElement(id, visible) {
        document.getElementById(id).style.display = visible?"block":"none";
    }

    function enableElement(id, enabled) {
        document.getElementById(id).disabled = !enabled;
    }

    function hideAllMenus() {
        showElement("screen_main", false);
        showElement("screen_host", false);
        showElement("screen_join", false);
        showElement("screen_game", false);
        if (!CL.authenticated) {
            enableElement("button_main_host", false);
            enableElement("button_main_join", false);
            enableElement("button_main_ok", false);
        }
        var chatDiv = document.getElementById("game_chat_container");
        chatDiv.innerHTML = "";
        SIMR.stop();
    }

    function onConnectedToServer() {
        enableElement("button_main_ok", true);
    }

    function onAuthentication() {
        enableElement("button_main_host", true);
        enableElement("button_main_join", true);
        document.getElementById("span_name").innerHTML = "Enter name:";
        document.getElementById("button_main_ok").innerHTML = "Change Name";
    }

    function onAuthFailed() {
        document.getElementById("span_name").innerHTML = "Name already taken! Enter a different one:";
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
            cell1.innerHTML = "(" + i + ")";
            cell2.innerHTML = getSafeString(clientList[i].name);
            cell3.innerHTML = "[" + clientList[i].state + "]";
        }
    }

    function startGame(id1, id2) {
        hideAllMenus();
        showElement("screen_game", true);
        resizeCanvas();
        SIMR.start(document.getElementById("game_canvas"));
    }

    function getMouseCoords(event, element) {
        var result = {};
        var rect = element.getBoundingClientRect();
        result.x = event.pageX - rect.left;
        result.y = event.pageY - rect.top;
        result.x /= CDRAW.getDrawRatio();
        result.y /= CDRAW.getDrawRatio();
        return result;
    }

    function canvasMouseMove(e) {
        var mouse = getMouseCoords(e, this);
        SIMR.setMouseCoords(mouse.x, mouse.y);
        SIMR.setStrength(getStrength(mouse));
    }

    function canvasMouseDown(e) {
        var mouse = getMouseCoords(e, this);
        SIMR.setMouseCoords(mouse.x, mouse.y);
        SIMR.setMouseDownState(true);
    }

    function canvasMouseUp(e) {
        var mouse = getMouseCoords(e, this);
        CL.playTurn(mouse.x, mouse.y, getStrength(mouse));
        SIMR.setMouseDownState(false);
        SIMR.setMouseCoords(mouse.x, mouse.y);
    }

    function getTouchCoords(event, element) {
        var touchobj = event.changedTouches[0];
        var result = {};
        var rect = element.getBoundingClientRect();
        result.x = touchobj.clientX - rect.left;
        result.y = touchobj.clientY - rect.top;
        result.x /= CDRAW.getDrawRatio();
        result.y /= CDRAW.getDrawRatio();
        return result;
    }

    function canvasTouchMove(e) {
        var mouse = getTouchCoords(e, this);
        SIMR.setMouseCoords(mouse.x, mouse.y);
        e.preventDefault()
        SIMR.setStrength(getStrength(mouse));
    }

    function canvasTouchDown(e) {
        var mouse = getTouchCoords(e, this);
        SIMR.setMouseCoords(mouse.x, mouse.y);
        SIMR.setMouseDownState(true);
        e.preventDefault();
    }

    function canvasTouchUp(e) {
        var mouse = getTouchCoords(e, this);
        CL.playTurn(mouse.x, mouse.y, getStrength(mouse));
        SIMR.setMouseDownState(false);
        SIMR.setMouseCoords(mouse.x, mouse.y);
        e.preventDefault();
    }

    function getStrength(mouse) {
        var currentPlayerPos = CL.simulation.playerBall[CL.simulation.currentTurn].position;
        var dragDistance = V2D.distance(currentPlayerPos, new V2D.Vector2d(mouse.x, mouse.y));
        var strength = dragDistance;
        strength /= CDRAW.getDrawRatio();
        strength = Math.min(MAX_STRENGTH_DISTANCE / CDRAW.getDrawRatio(), strength);
        strength /= MAX_STRENGTH_DISTANCE / CDRAW.getDrawRatio();
        return strength;
    }

    function adjustChatbox() {
        var chatDiv = document.getElementById("game_chat_container");
        var canvas = document.getElementById("game_canvas");
        while (chatDiv.offsetHeight > canvas.offsetHeight) {
            chatDiv.removeChild(chatDiv.childNodes[0]);
        }
    }

    var chatIntervalHandle = null;
    function displayInfoMessage(message) {
        showElement("game_chat_container", true);
        var chatDiv = document.getElementById("game_chat_container");
        if (chatDiv.innerHTML != "")
            chatDiv.innerHTML += "<br/>"
        chatDiv.innerHTML += "<span>" + message + "</span>";
        adjustChatbox();
        if (chatIntervalHandle) window.clearInterval(chatIntervalHandle);
        chatIntervalHandle = window.setInterval(hideChat, CHAT_HIDE_TIME);
    }

    function displayChatMessage(name, message) {
        var message = "[" + getSafeString(name) + "]: " + getSafeString(message);
        displayInfoMessage(message);
    }

    function hideChat() {
        showElement("game_chat_container", false);
        window.clearInterval(chatIntervalHandle);
    }

    function resizeCanvas() {
        var canvas = document.getElementById("game_canvas");
        var container = document.getElementById("game_canvas_container");
        var input = document.getElementById("game_input_area");
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        if (canvas.width / canvas.height > gameFrame.width / gameFrame.height) {
        	CDRAW.setDrawRatio(canvas.height / gameFrame.height);
        } else {
        	CDRAW.setDrawRatio(canvas.width / gameFrame.width);
        }
        canvas.width = CDRAW.getDrawRatio() * gameFrame.width;
        canvas.height = CDRAW.getDrawRatio() * gameFrame.height;

        var chat = document.getElementById("game_chat_container");
        chat.style.maxWidth = CDRAW.getDrawRatio() * gameFrame.width + "px";
    }

    function onWindowResize(e) {
        resizeCanvas();
        adjustChatbox();
    }

    // Public

    var module = {};

    module.onPageLoad = function() {
        module.mainMenu();
        CL.connect(onConnectedToServer);
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

    module.setName = function() {
        if (CL.authenticated) {
            CL.changeName(document.getElementById("input_name").value);
            return;
        }
        if (CL.connected) {
            CL.requestAuthentication(document.getElementById("input_name").value, onAuthentication, onAuthFailed);
            return;
        }
    }

    module.hostMenu = function() {
        hideAllMenus();
        CL.host();
        showElement("screen_host", true);
    }

    module.joinMenu = function() {
        hideAllMenus();
        showElement("screen_join", true);

        refreshClientList(CL.getClientList());
    }

    module.joinRefresh = function() {
        refreshClientList(CL.getClientList());
    }

    module.joinClient = function() {
        var select = document.getElementById("list_join_clients");
        var hostID = select.options[select.selectedIndex].value;
        CL.join(hostID);
    }

    module.mainMenu = function() {
        hideAllMenus();
        CL.idle();
        document.getElementById("input_name").value = getSafeString(CL.clientName);
        document.getElementById("span_name").innerHTML = "Enter name:";
        showElement("screen_main", true);
    }

    module.sendChatMessage = function() {
        var input = document.getElementById("input_chat");
        var message = input.value;
        if (message != "") {
            input.value = "";
            CL.chat(message);
        }
    }

    module.handleChatKeyPress = function(e) {
        if (e.keyCode == 13) {
            module.sendChatMessage();
        }
    }

    module.handleNameKeyPress = function(e) {
        if (e.keyCode == 13) {
            module.setName();
        }
    }

    return module;
}(CL, SIMR));
