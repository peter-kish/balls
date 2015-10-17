var PORT_NUMBER = 1337;
var NAME_LENGTH_LIMIT = 16;

console.log(".:Balls Server:.");

var WebSocketServer = require('websocket').server;
var http = require('http');
var uuid = require('node-uuid');
var fs = require('fs');
var sim = require('./sh_simulation.js');

var clients = [];
var games = [];

var server = http.createServer(function(request, response) {
	if(request.url.indexOf('.js') != -1){
		fs.readFile("./" + request.url, function(err, script) {
			if (err) {
				throw err;
			}

			response.writeHeader(200, {"Content-Type": "text/javascript"});
			response.write(script);
			response.end();
		});
	} else if (request.url.indexOf('.css') != -1) {

	} else if (request.url.indexOf('.ico') != -1) {

	} else {
		fs.readFile('./frontend.html', function(err, html) {
			if (err) {
				throw err;
			}

			response.writeHeader(200, {"Content-Type": "text/html"});
			response.write(html);
			response.end();
		});
	}

});
server.listen(PORT_NUMBER, function() { });

// create the server
wsServer = new WebSocketServer({
	httpServer: server
});

// WebSocket server
wsServer.on('request', handleWsRequest);


function handleWsRequest(request) {
    var connection = request.accept(null, request.origin);
    var id = "";
    console.log("Connection from " + request.remoteAddress);

    // Message handling
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			//console.log(message.utf8Data);
            var json = JSON.parse(message.utf8Data);
            switch (json.msgType) {
                case "authRequest":
                    id = handleAuthRequest(connection, json.msgData.name);
                    break;
                case "changeName":
                    handleChangeName(id, json.msgData.name);
                    break;
                case "host":
                    handleClientHosting(id);
                    break;
                case "join":
                    handleClientJoin(id, json.msgData.hostId);
                    break;
                case "idle":
                    handleClientIdle(id);
                    break;
                case "turn":
                    handleClientTurn(id, json.msgData.x, json.msgData.y);
                    break;
                case "chat":
                    handleClientChat(id, json.msgData.message);
                default:

            }
        }
    });

    connection.on('close', function(connection) {
        // handleClientDisconnect(id);
		var client = getClient(id);
		if (client) {
			console.log(client.name + " disconnected.");
			broadcast(JSON.stringify({msgType: "clientDisconnected", msgData: {id: id, name: client.name}}));
			removeClient(id);
		}
    });
}

function handleAuthRequest(connection, name) {
	name = name.substring(0, NAME_LENGTH_LIMIT);
    if (getClientByName(name)) {
        // Denied
		console.log("Player name (" + name + ") already taken.");
        var message = JSON.stringify({msgType: "authDenied", msgData: {reason: "Name already taken"}});
        connection.sendUTF(message);
        return "";
    } else {
        // Accepted
		console.log("Authenticated (" + name + ").");
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
	if (getClientByName(newName))
		return;

    var clientData = getClient(id);
    if (clientData) {
		console.log(clientData.name + " changed his name to " + newName.substring(0, NAME_LENGTH_LIMIT));
        clientData.name = newName.substring(0, NAME_LENGTH_LIMIT);
        broadcast(JSON.stringify({msgType: "newName", msgData: {id: id, name: clientData.name}}));
    }
}

function handleClientHosting(id) {
    var clientData = getClient(id);
    if (clientData && clientData.state == "idle") {
		console.log(clientData.name + " is hosting...");
        clientData.state = "hosting";
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: id, state: "hosting"}}));
    }
}

function handleClientJoin(id, hostId) {
    var joinerClientData = getClient(id);
    var hosterClientData = getClient(hostId);
    if (joinerClientData.state == "idle" && hosterClientData.state == "hosting") {
		console.log(joinerClientData.name + " and " + hosterClientData.name + " started playing.");
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
		console.log(clientData.name + " is idle...");
        clientData.state = "idle";
        broadcast(JSON.stringify({msgType: "newState", msgData: {id: id, state: "idle"}}));
        removeGameContainingClient(id);
    }
}

function handleClientTurn(id, x, y) {
    var clientData = getClient(id);
    if (clientData && clientData.state == "playing") {
        var game = getGameContainingClient(id);
		if (game && sim.isTurnValid(game.simulation, id, x, y)) {
			console.log(getClient(id).name + " played (" + x + "," + y + ")");
        	var opponentId = getOpponentId(id);
        	var state = sim.simulateTurn(game.simulation, id, x, y);
        	unicast(id, JSON.stringify({msgType: "turn", msgData: {id: id, x: x, y: y, result: state}}));
        	unicast(opponentId, JSON.stringify({msgType: "turn", msgData: {id: id, x: x, y: y, result: state}}));
		}
    }
}

function handleClientChat(id, msg) {
	console.log("[chat] " + getClient(id).name + ": " + msg);
    broadcast(JSON.stringify({msgType: "chat", msgData: {id: id, message: msg}}));
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

function createGame(id1, id2) {
    var gameData = {};
    gameData.id1 = id1;
    gameData.id2 = id2;
    gameData.simulation = sim.createSimulation(id1, id2);
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
