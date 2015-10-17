var FE = (function () {
    // Private

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
        var textArea = document.getElementById("text_game_chatbox");
        textArea.value = "";
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
        SIMR.start(document.getElementById("game_canvas"));
    }

    function canvasClick(e) {
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        CL.playTurn(x, y);
    }

    function canvasMouseMove(e) {
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        SIMR.setMouseCoords(x, y);
    }

    function displayChatMessage(name, message) {
        var textArea = document.getElementById("text_game_chatbox");
        var message = "[" + getSafeString(name) + "]: " + getSafeString(message);
        if (textArea.value != "")
            textArea.value += "\n";
        textArea.value += message;
        textArea.scrollTop = textArea.scrollHeight;
    }

    function displayInfoMessage(message) {
        var textArea = document.getElementById("text_game_chatbox");
        var message = getSafeString(message);
        if (textArea.value != "")
            textArea.value += "\n";
        textArea.value += message;
        textArea.scrollTop = textArea.scrollHeight;
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
        var canvas = document.getElementById("game_canvas");
        canvas.addEventListener('click', canvasClick, false);
        canvas.addEventListener('mousemove', canvasMouseMove);
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
