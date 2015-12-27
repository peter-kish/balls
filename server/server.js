var DEFAULT_PORT_NUMBER = 8080;
var NAME_LENGTH_LIMIT = 16;

function LOG(text) {
	var date = new Date;
	console.log("[" + date.toLocaleString() + "] " + text);
}

LOG(".:Balls Server:.");

var WebSocketServer = require('websocket').server;
var http = require('http');
var uuid = require('node-uuid');
var fs = require('fs');
var sim = require('../shared/sh_simulation.js');
var ai = require('./ai.js');
var express = require('express');
var serveStatic = require('serve-static');

var clients = [];
var games = [];
var botId = "BOT";
var serverConfig = {};

loadConfig("./config_server.json");

function loadConfig(configFile) {
	try {
		var contents = fs.readFileSync(configFile).toString();
		serverConfig = JSON.parse(contents);
	} catch(err) {
		LOG(configFile + " not found. Using default values...");
	}
}

// app that can serve static content
var app = express();

//include static content
app.use(serveStatic('../shared'));
app.use(serveStatic('../client/desktop'));

//create server from app
var server = http.createServer(app);

//listen to configured port
server.listen(serverConfig.port ? serverConfig.port : DEFAULT_PORT_NUMBER, function() { });

// create the server
wsServer = new WebSocketServer({
	httpServer: server
});

// WebSocket server
wsServer.on('request', handleWsRequest);


function handleWsRequest(request) {
    var connection = request.accept(null, request.origin);
    var id = "";
    LOG("Connection from " + request.remoteAddress);

    // Message handling
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			//LOG(message.utf8Data);
            var json = JSON.parse(message.utf8Data);
            switch (json.msgType) {
                case "authRequest":
					if (id == "")
                    	id = handleAuthRequest(connection, json.msgData.name);
                    break;
                case "changeName":
                    handleChangeName(id, json.msgData.name);
                    break;
                case "host":
                    handleClientHosting(id);
                    break;
                case "join":
                    handleClientJoin(id, json.msgData.hostId, json.msgData.difficulty);
                    break;
                case "idle":
                    handleClientIdle(id);
                    break;
                case "turn":
                    handleClientTurn(id, json.msgData.x, json.msgData.y, json.msgData.strength);
                    break;
                case "chat":
                    handleClientChat(id, json.msgData.message, json.msgData.local);
                default:

            }
        }
    });

    connection.on('close', function(connection) {
        // handleClientDisconnect(id);
		var client = getClient(id);
		if (client) {
			LOG(client.name + " disconnected.");
			broadcast(JSON.stringify({msgType: "clientDisconnected", msgData: {id: id, name: client.name}}));
			removeClient(id);
		}
    });
}

function handleAuthRequest(connection, name) {
	var validationResult = validateName(name);
    if (validationResult != "") {
        // Denied
		LOG("Player name (" + name + ") denied: " + validationResult);
        var message = JSON.stringify({msgType: "authDenied", msgData: {reason: validationResult}});
        connection.sendUTF(message);
        return "";
    } else {
        // Accepted
		LOG("Authenticated (" + name + ").");
        var clientData = createClient(connection, name);
        var message = JSON.stringify({msgType: "authenticated", msgData: {id: clientData.id}});
        connection.sendUTF(message);
        var clientList = getClientList();
        connection.sendUTF(JSON.stringify({msgType: "clientList", msgData: {list: clientList}}));
		broadcast(JSON.stringify({msgType: "clientConnected", msgData: {id: clientData.id, name: clientData.name}}));
        return clientData.id;
    }
}

function handleChangeName(id, newName) {
	var validationResult = validateName(newName);
    var clientData = getClient(id);
    if (clientData) {
		if (validationResult == "") {
			LOG(clientData.name + " changed his name to " + newName.substring(0, NAME_LENGTH_LIMIT));
			clientData.name = newName.substring(0, NAME_LENGTH_LIMIT);
			broadcast(JSON.stringify({msgType: "newName", msgData: {id: id, name: clientData.name}}));
		} else {
			LOG("New player name for " + clientData.name + " denied: " + validationResult);
			unicast(id, JSON.stringify({msgType: "serverError", msgData: {message: validationResult}}));
		}
    }
}

function validateName(name) {
	if (getClientByName(name)) {
		return "Name already taken.";
	}
	if (name.length > NAME_LENGTH_LIMIT) {
		return "Name too long."
	}
	if (name.length <= 1) {
		return "Name too short."
	}

	return "";
}

function handleClientHosting(id) {
    var clientData = getClient(id);
    if (clientData && clientData.state == "idle") {
		LOG(clientData.name + " is hosting...");
        clientData.state = "hosting";
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: id, state: "hosting"}}));
    }
}

function handleClientJoin(id, hostId, difficulty) {
	if (isBot(hostId)) {
		handleClientJoinBot(id, difficulty);
	} else {
    	handleClientJoinPlayer(id, hostId);
	}
}

function handleClientJoinBot(id, difficulty) {
	var joinerClientData = getClient(id);
    if (joinerClientData && joinerClientData.state == "idle") {
		LOG(joinerClientData.name + " started playing against a bot (difficulty: " + difficulty + ").");
        joinerClientData.state = "playing";
        unicast(id, JSON.stringify({msgType: "gameStart", msgData: {player1: id, player2: botId}}));
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: id, state: "playing"}}));
        createGame(id, botId, difficulty);
    }
}

function handleClientJoinPlayer(id, hostId) {
	var joinerClientData = getClient(id);
    var hosterClientData = getClient(hostId);
	if (!joinerClientData || !hosterClientData)
		return;
    if (joinerClientData.state == "idle" && hosterClientData.state == "hosting") {
		LOG(joinerClientData.name + " and " + hosterClientData.name + " started playing.");
        joinerClientData.state = "playing";
        hosterClientData.state = "playing";
        unicast(id, JSON.stringify({msgType: "gameStart", msgData: {player1: id, player2: hostId}}));
        unicast(hostId, JSON.stringify({msgType: "gameStart", msgData: {player1: id, player2: hostId}}));
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: id, state: "playing"}}));
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: hostId, state: "playing"}}));
        createGame(id, hostId);
    }
}

function handleClientIdle(id) {
    var clientData = getClient(id);
    if (clientData) {
		LOG(clientData.name + " is idle...");
        clientData.state = "idle";
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: id, state: "idle"}}));
        removeGameContainingClient(id);
    }
}

function handleClientTurn(id, x, y, strength) {
    var clientData = getClient(id);
    if (clientData && clientData.state == "playing") {
        var game = getGameContainingClient(id);
		if (game && sim.isTurnValid(game.simulation, id, x, y, strength)) {
			LOG(clientData.name + " played (" + x + "," + y + ") - " + strength);
        	var opponentId = getOpponentId(id);
			var originalState = sim.getState(game.simulation);
        	var resultState = sim.simulateTurn(game.simulation, id, x, y, strength);
        	unicast(id, JSON.stringify({msgType: "turn", msgData: {id: id, x: x, y: y, strength: strength, result: resultState, origin: originalState}}));
			if (!isBot(opponentId)) {
        		unicast(opponentId, JSON.stringify({msgType: "turn", msgData: {id: id, x: x, y: y, strength: strength, result: resultState, origin: originalState}}));
			} else {
				var aiTurn = ai.getTurn(1, sim.getState(game.simulation), game.difficulty);
				LOG("Bot played (" + aiTurn.x + "," + aiTurn.y + ") - " + aiTurn.strength);
				originalState = sim.getState(game.simulation);
	        	resultState = sim.simulateTurn(game.simulation, botId, aiTurn.x, aiTurn.y, aiTurn.strength);
				unicast(id, JSON.stringify({msgType: "turn", msgData: {id: botId, x: aiTurn.x, y: aiTurn.y, strength: aiTurn.strength, result: resultState, origin: originalState}}));
			}
		}
    }
}

function handleClientChat(id, msg, local) {
	var client = getClient(id);
	if (client) {
		if (local) {
			var opponent = getClient(getOpponentId(id));
			if (opponent) {
				LOG("[chat-local] " + client.name + ": " + msg);
				unicast(id, JSON.stringify({msgType: "chat", msgData: {id: id, message: msg, local: true}}));
				unicast(opponent.id, JSON.stringify({msgType: "chat", msgData: {id: id, message: msg, local: true}}));
			}
		} else {
			LOG("[chat] " + client.name + ": " + msg);
			broadcast(JSON.stringify({msgType: "chat", msgData: {id: id, message: msg}}));
		}
	}
}

function handleClientDisconnect(id) {
    removeGameContainingClient(id);
    removeClient(id);
    broadcast(JSON.stringify({msgType: "disconnected", msgData: {id: id}}));
}

function broadcast(message) {
	for (var i = 0; i < clients.length; i++) {
		clients[i].connection.sendUTF(message);
	}
}

function unicast(id, message) {
	var client = getClient(id);
	if (client) {
		client.connection.sendUTF(message);
	}
}

function createClient(connection, name) {
	var clientData = {};
	clientData.connection = connection;
	clientData.id = getNewID();
    clientData.name = name;
    clientData.state = "idle";
	clients.push(clientData);
	return clientData;
}

function removeClient(id) {
	for (var i = 0; i < clients.length; i++) {
		if (clients[i].id == id) {
			clients.splice(i, 1);
			return;
		}
	}
}

function getClient(id) {
	for (var i = 0; i < clients.length; i++) {
		if (clients[i].id == id) {
			return clients[i];
		}
	}
	return null;
}

function getClientByName(name) {
    for (var i = 0; i < clients.length; i++) {
		if (clients[i].name == name) {
			return clients[i];
		}
	}
	return null;
}

function getClientList() {
    var list = new Array(clients.length);
    for (var i = 0; i < clients.length; i++) {
        list[i] = {};
        list[i].id = clients[i].id;
        list[i].name = clients[i].name;
        list[i].state = clients[i].state;
    }
    return list;
}

function createGame(id1, id2, difficulty) {
	if (!difficulty)
		difficulty = "hard";

    var gameData = {};
    gameData.id1 = id1;
    gameData.id2 = id2;
    gameData.simulation = sim.createSimulation(id1, id2);
	gameData.difficulty = difficulty;
    games.push(gameData);
    return gameData;
}

function getOpponentId(id) {
	var game = getGameContainingClient(id);
	if (game) {
		if (game.id1 == id) {
			return game.id2;
		} else {
			return game.id1;
		}
	}
	return null;
}

function isBot(id) {
	return id == botId;
}

function getGameContainingClient(id) {
	for (var i = 0; i < games.length; i++) {
        if (games[i].id1 == id || games[i].id2 == id) {
            return games[i];
        }
    }
	return null;
}

function removeGameContainingClient(id) {
    for (var i = 0; i < games.length; i++) {
        if (games[i].id1 == id || games[i].id2 == id) {
            games.splice(i, 1);
            return;
        }
    }
}

function getNewID() {
	return uuid.v1();
}
