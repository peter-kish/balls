var FE = (function () {
    // Private

    var CHAT_HIDE_TIME = 15000;
    var activeMenu = "main"; // main, host, join, game

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

    function showElement(id, visible) {
        document.getElementById(id).style.display = visible?"block":"none";
    }

    function enableElement(id, enabled) {
        document.getElementById(id).disabled = !enabled;
    }

    function clearElement(id) {
        var element = document.getElementById(id);
        element.innerHTML = "";
    }

    function scrollToBottom(id) {
        var element = document.getElementById(id);
        element.scrollTop = element.scrollHeight;
    }

    function hideAllMenus() {
        showElement("screen_main", false);
        showElement("screen_host", false);
        showElement("screen_join", false);
        showElement("screen_game", false);
        if (!CL.authenticated) {
            enableElement("button_main_ok", false);
            showElement("main_connected", false);
        }
        clearElement("game_chat_container");
        clearElement("main_chat_container");
        SIMR.stop();
    }

    function onConnectedToServer() {
        enableElement("button_main_ok", true);
    }

    function onAuthentication() {
        enableElement("button_main_ok", true);
        showElement("main_connected", true);
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
        SIMR.start(document.getElementById("game_canvas"));
        resizeCanvas();
        activeMenu = "game";
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
            chatDiv.innerHTML += "<br/>"
        chatDiv.innerHTML += "<span>" + message + "</span>";
    }

    var chatIntervalHandle = null;
    function displayInfoMessage(message) {
        if (activeMenu == "game") {
            showElement("game_chat_container", true);
            addMessageSpan("game_chat_container", message);
            adjustChatbox();
            if (chatIntervalHandle) window.clearInterval(chatIntervalHandle);
            chatIntervalHandle = window.setInterval(hideChat, CHAT_HIDE_TIME);
        } else {
            addMessageSpan("main_chat_container", message);
            scrollToBottom("main_chat_container");
        }
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
            enableElement("button_main_ok", false);
            return;
        }
    }

    module.hostMenu = function() {
        hideAllMenus();
        CL.host();
        showElement("screen_host", true);
        activeMenu = "host";
    }

    module.joinMenu = function() {
        hideAllMenus();
        showElement("screen_join", true);
        refreshClientList(CL.getClientList());
        activeMenu = "join";
    }

    module.joinRefresh = function() {
        refreshClientList(CL.getClientList());
    }

    module.joinClient = function() {
        var select = document.getElementById("list_join_clients");
        var hostID = select.options[select.selectedIndex].value;
        CL.join(hostID);
    }

    module.joinBot = function() {
        CL.joinBot();
    }

    module.mainMenu = function() {
        hideAllMenus();
        CL.idle();
        document.getElementById("input_name").value = getSafeString(CL.clientName);
        document.getElementById("span_name").innerHTML = "Enter name:";
        showElement("screen_main", true);
        activeMenu = "main";
    }

    module.sendChatMessage = function() {
        var input = null;
        if (activeMenu == "game") {
            input = document.getElementById("input_game_chat");
        } else {
            input = document.getElementById("input_main_chat");
        }
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
