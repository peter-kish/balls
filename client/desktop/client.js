var CL = (function () {
    SIM.onTurnStart = onTurnStart;
    SIM.onVictory = onVictory;
    // Private
    var CHAT_MSG_LIMIT = 128;

    var connection;
    var clientList = [];
    var missedTurnMsg = null;
    var botId = "BOT";

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
        if (isBot(id)) {
            var bot = {};
            bot.id = botId;
            bot.name = "BOT";
            bot.state = "playing";
            return bot;
        }

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

    function onTurnStart(id) {
        if (module.onTurnStart) module.onTurnStart(id);
        if (missedTurnMsg) {
            SIM.setState(module.simulation, missedTurnMsg.origin);
            SIM.turn(module.simulation, missedTurnMsg.id, missedTurnMsg.x, missedTurnMsg.y, missedTurnMsg.strength);
            missedTurnMsg = null;
        }
    }

    function onVictory(id) {
        if (module.onVictory) module.onVictory(id);
    }

    function isBot(id) {
        return id == botId;
    }

    // Public

    var module = {};

    module.onConnected = null;
    module.onAuthSuccessfull = null;
    module.onAuthFailed = null;
    module.onError = null;
    module.onClientListChanged = null;
    module.onGameStarted = null;
    module.onChatMessage = null;
    module.onLocalChatMessage = null;
    module.onInfoMessage = null;
    module.onTurnStart = null;
    module.onVictory = null;
    module.onOpponentLeft = null;
    module.onServerError = null;

    module.clientName = "";
    module.clientId = "";
    module.opponentId = "";
    module.clientState = "idle";
    module.connected = false;
    module.authenticated = false;

    module.simulation = null;

    module.connect = function(onConectedCallback) {
        module.onConnected = onConectedCallback;
        connection = new WebSocket(clientConfig.server);

        connection.onopen = function () {
            if (module.onConnected) module.onConnected();
			// connection is opened and ready to use
            console.log("Connected to " + clientConfig.server);
            module.connected = true;
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
                        if (module.onAuthFailed) module.onAuthFailed(json.msgData.reason);
                        break;
                    case "clientList":
                        clearClients();
                        clientList = json.msgData.list;
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "clientConnected":
                        console.log(json.msgData.name + " connected.");
                        if (module.onInfoMessage) module.onInfoMessage(json.msgData.name + " connected.");
                        addClient(json.msgData.id, json.msgData.name);
                        if (json.msgData.id == module.clientId)
                            module.clientName = json.msgData.name;
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "clientDisconnected":
                        console.log(json.msgData.name + " disconnected.");
                        if (module.onInfoMessage) module.onInfoMessage(json.msgData.name + " disconnected.");
                        if (json.msgData.id == module.opponentId) {
                            if (module.onOpponentLeft) module.onOpponentLeft(module.opponentId);
                        }
                        removeClient(json.msgData.id);
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "newName":
                        var client = getClient(json.msgData.id);
                        console.log(client.name + " changed his name to " + json.msgData.name);
                        if (module.onInfoMessage) module.onInfoMessage(client.name + " changed his name to " + json.msgData.name);
                        client.name = json.msgData.name;
                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "newState":
                        var client = getClient(json.msgData.id);
                        client.state = json.msgData.state;
                        if (client.id == module.opponentId && client.state == "idle") {
                            if (module.onInfoMessage) module.onInfoMessage(getClient(module.opponentId).name + " has left the game!");
                            if (module.onOpponentLeft) module.onOpponentLeft(module.opponentId);
                        }
                        if (client.id == module.clientId) {
                            module.clientState = client.state;
                        }

                        if (module.onClientListChanged) module.onClientListChanged(clientList);
                        break;
                    case "gameStart":
                        console.log("Game started: " + getClient(json.msgData.player1).name + " VS " + getClient(json.msgData.player2).name);
                        if (json.msgData.player1 == module.clientId || json.msgData.player2 == module.clientId) {
                            module.opponentId = (json.msgData.player1 == module.clientId) ? json.msgData.player2 : json.msgData.player1;
                            module.simulation = new SIM.createSimulation(json.msgData.player1, json.msgData.player2);
                            if (module.onGameStarted) module.onGameStarted();
                        }
                        break;
                    case "turn":
                        var client = getClient(json.msgData.id);
                        if (client.id != module.clientId) {
                            if (module.simulation) {
                                if (!SIM.isIdle(module.simulation)) {
                                    missedTurnMsg = json.msgData;
                                } else {
                                    SIM.setState(module.simulation, json.msgData.origin);
                                    SIM.turn(module.simulation, json.msgData.id, json.msgData.x, json.msgData.y, json.msgData.strength);
                                }
                            }
                        }
                        console.log(client.name + " played (" + json.msgData.x + "," + json.msgData.y + ") - " + json.msgData.strength);
                        //console.log(JSON.stringify(json.msgData.result));
                        break;
                    case "chat":
                        var client = getClient(json.msgData.id);
                        if (client) {
                            if (json.msgData.local) {
                                console.log("LOCAL [" + client.name + "]: " + json.msgData.message);
                                if (module.onLocalChatMessage) module.onLocalChatMessage(client.name, json.msgData.message);
                            } else {
                                console.log("[" + client.name + "]: " + json.msgData.message);
                                if (module.onChatMessage) module.onChatMessage(client.name, json.msgData.message);
                            }
                        }
                        break;
                    case "serverError":
                        console.log("<SERVER>: " + json.msgData.message);;
                        if (module.onServerError) module.onServerError(json.msgData.message);
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

    module.joinBot = function(difficulty) {
        if (module.connected)
            connection.send(JSON.stringify({msgType: "join", msgData: {hostId: botId, difficulty: difficulty}}));
    }

    module.idle = function() {
        module.opponentId = "";
        if (module.connected)
            connection.send(JSON.stringify({msgType: "idle"}));
    }

    module.playTurn = function (x, y, strength) {
        if (module.connected) {
            if (module.simulation) {
                if (SIM.turn(module.simulation, module.clientId, x, y, strength)) {
                    connection.send(JSON.stringify({msgType: "turn", msgData: {x: x, y: y, strength: strength}}));
                }
            }
        }
    }

    module.chat = function (message, local) {
        if (module.connected) {
            connection.send(JSON.stringify({msgType: "chat", msgData: {local: local, message: message.substring(0, CHAT_MSG_LIMIT)}}));
        }
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
