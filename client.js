var CL = (function () {
    // Private
    var SERVER_ADDR = "ws://lateralus.duckdns.org:80";
    var CHAT_MSG_LIMIT = 128;

    var connection;
    var clientList = [];

    function addClient(id, name) {
        if (getClient(id))
            return;

        var newClient = {};
        newClient.id = id;
        newClient.name = name;
        newClient.state = "idle";
        clientList.push(newClient);
    }

    function getClient(id) {
        for (var i = 0; i < clientList.length; i++) {
            if (clientList[i].id == id) {
                return clientList[i];
            }
        }
    }

    function removeClient(id) {
        for (var i = 0; i < clientList.length; i++) {
            if (clientList[i].id == id) {
                clientList.splice(i, 1);
            }
        }
    }

    function clearClients() {
        clientList = [];
    }

    // Public

    var module = {};

    module.onConnectionSuccessfull = null;
    module.onAuthSuccessfull = null;
    module.onAuthFailed = null;
    module.onError = null;
    module.onClientListChanged = null;
    module.onGameStarted = null;
    module.onChatMessage = null;
    module.onInfoMessage = null;

    module.clientName = "";
    module.clientId = "";
    module.opponenId = "";
    module.clientState = "idle";
    module.connected = false;
    module.authenticated = false;

    module.simulation = null;
    module.latestServerState = null;

    module.connect = function(onConectedCallback) {
        module.onConnectionSuccessfull = onConectedCallback;
        connection = new WebSocket(SERVER_ADDR);

        connection.onopen = function () {
			// connection is opened and ready to use
            console.log("Connected to " + SERVER_ADDR);
            module.connected = true;
			if (module.onConnectionSuccessfull) module.onConnectionSuccessfull(SERVER_ADDR);
		};

        connection.onerror = function (error) {
			// an error occurred when sending/receiving data
			if (module.onError) module.onError(error);
		};

        connection.onmessage = function (message) {
            var json = JSON.parse(message.data);
            if (json.msgType) {
                switch (json.msgType) {
                    case "authenticated":
                        console.log("Authenticated");
                        module.authenticated = true;
                        module.clientId = json.msgData.id;
                        if (module.onAuthSuccessfull) module.onAuthSuccessfull();
                        break;
                    case "authDenied":
                        console.log("Authentication failed");
                        if (module.onAuthFailed) module.onAuthFailed();
                    case "clientList":
                        clearClients();
                        clientList = json.msgData.list;
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "clientConnected":
                        console.log(json.msgData.name + " connected.");
                        addClient(json.msgData.id, json.msgData.name);
                        if (json.msgData.id == module.clientId)
                            module.clientName = json.msgData.name;
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "clientDisconnected":
                        console.log(json.msgData.name + " disconnected.");
                        if (json.msgData.id == module.opponenId) {
                            if (module.onInfoMessage) module.onInfoMessage(getClient(module.opponenId).name + " has disconnected!");
                        }
                        removeClient(json.msgData.id);
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "newName":
                        var client = getClient(json.msgData.id);
                        console.log(client.name + " changed his name to " + json.msgData.name);
                        client.name = json.msgData.name;
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "newState":
                        var client = getClient(json.msgData.id);
                        client.state = json.msgData.state;
                        if (client.id == module.opponenId && client.state == "idle") {
                            if (module.onInfoMessage) module.onInfoMessage(getClient(module.opponenId).name + " has left the game!");
                        }
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "gameStart":
                        console.log("Game started: " + getClient(json.msgData.player1).name + " VS " + getClient(json.msgData.player2).name);
                        if (json.msgData.player1 == module.clientId || json.msgData.player2 == module.clientId) {
                            module.opponenId = (json.msgData.player1 == module.clientId) ? json.msgData.player2 : json.msgData.player1;
                            module.simulation = new SIM.createSimulation(json.msgData.player1, json.msgData.player2);
                            module.latestServerState = null;
                            if (module.onGameStarted) module.onGameStarted();
                        }
                        break;
                    case "turn":
                        var client = getClient(json.msgData.id);
                        console.log(client.name + " played (" + json.msgData.x + "," + json.msgData.y + ")");
                        if (module.simulation) {
                            if (client.id != module.clientId) {
                                if (module.latestServerState) {
                                    SIM.setState(module.simulation, module.latestServerState);
                                }
                                SIM.turn(module.simulation, json.msgData.id, json.msgData.x, json.msgData.y);
                            }
                            module.latestServerState = json.msgData.result;
                        }
                        //console.log(JSON.stringify(json.msgData.result));
                        break;
                    case "chat":
                        var client = getClient(json.msgData.id);
                        console.log("[" + client.name + "]: " + json.msgData.message);
                        if (module.onChatMessage) module.onChatMessage(client.name, json.msgData.message);
                        break;
                    default:

                }
            }
        };
    }

    module.requestAuthentication = function(name, onAuthCallback, onAuthFailedCallback) {
        if (module.connected) {
            connection.send(JSON.stringify({msgType: "authRequest", msgData: {name: name}}));
            module.onAuthSuccessfull = onAuthCallback;
            module.onAuthFailed = onAuthFailedCallback;
        }
    }

    module.changeName = function(newName) {
        if (module.connected)
            connection.send(JSON.stringify({msgType: "changeName", msgData: {name: newName}}));
    }

    module.host = function() {
        if (module.connected)
            connection.send(JSON.stringify({msgType: "host"}));
    }

    module.join = function(hostId) {
        if (module.connected)
            connection.send(JSON.stringify({msgType: "join", msgData: {hostId: hostId}}));
    }

    module.idle = function() {
        module.opponenId = "";
        if (module.connected)
            connection.send(JSON.stringify({msgType: "idle"}));
    }

    module.playTurn = function (x, y) {
        if (module.connected) {
            connection.send(JSON.stringify({msgType: "turn", msgData: {x: x, y: y}}));
            if (module.simulation)
                SIM.turn(module.simulation, module.clientId, x, y);
        }
    }

    module.chat = function (message) {
        if (module.connected)
            connection.send(JSON.stringify({msgType: "chat", msgData: {message: message.substring(0, CHAT_MSG_LIMIT)}}));
    }

    module.getClientName = function (id) {
        var client = getClient(id);
        if (client) {
            return client.name;
        }
        return "";
    }

    module.getClientList = function() {
        return clientList;
    }

    return module;
}());
