var V2D = require('../shared/sh_vector.js');
var sim = require('../shared/sh_simulation.js');

var _radialIterations = 36;
var _strengthIterations = 3;
var _p1Index = 0
var _p2Index = 1
var _fieldSize = sim.getPlayFieldSize();
var _maxDistance = Math.sqrt(Math.pow(_fieldSize.width, 2) + Math.pow(_fieldSize.height, 2));
var _bestScore = Number.MAX_VALUE / 4;
var _worstScore = -_bestScore;
var _botId = "BOT";

exports.getTurn = function(playerIndex, state) {
    var playerPos = new V2D.Vector2d(0, 0);
    if (playerIndex == _p1Index) {
        playerPos.set(state.p1Pos);
    } else {
        playerPos.set(state.p2Pos);
    }
    return _getBestTurn(playerIndex, state, _getTurnList(playerPos));
}

function _getBestTurn(playerIndex, state, turns) {
    var bestScore = _worstScore;
    var bestTurnIndex = 0;

    for (var i = 0; i < turns.length; i++) {
        var simulation = sim.createSimulation(_p1Index, _p2Index);
        simulation.switchTurns();
        sim.setState(simulation, state);
        var resultState = sim.simulateTurn(simulation, playerIndex, turns[i].x, turns[i].y, turns[i].strength);
        var score = _rateState(playerIndex, resultState) - _rateState(_getOpponentIndex(playerIndex), resultState);
        if (score > bestScore) {
            bestScore = score;
            bestTurnIndex = i;
        }
    }
    return turns[bestTurnIndex];
}

function _rateState(playerIndex, state) {
    if (state.victory == playerIndex) {
        //console.log("Victory detected!");
        return _bestScore;
    } else if (state.victory == _getOpponentIndex(playerIndex)) {
        //console.log("Loss detected!");
        return _worstScore;
    }

    var goalDistanceScore = _rateDistanceToGoal(playerIndex, state);
    var goalDistanceWeight = 1;
    var ballDistanceScore = _rateDistanceToBall(playerIndex, state);
    var ballDistanceWeight = 0.25;

    var score = (goalDistanceWeight * goalDistanceScore + ballDistanceWeight * ballDistanceScore) / (goalDistanceWeight + ballDistanceWeight);

    //console.log("Rating state: p1" + playerPos[_p1Index] + " p2" + playerPos[_p2Index] + " ball" + ballPos + " with score: " + score);
    return score;
}

function _rateDistanceToGoal(playerIndex, state) {
    var playerPos = [];
    playerPos[_p1Index] = new V2D.Vector2d(state.p1Pos.x, state.p1Pos.y);
    playerPos[_p2Index] = new V2D.Vector2d(state.p2Pos.x, state.p2Pos.y);
    var ballPos = new V2D.Vector2d(state.ballPos.x, state.ballPos.y);
    var goalPos = [];
    goalPos[_p1Index] = sim.getGoalPosition(_p1Index);
    goalPos[_p2Index] = sim.getGoalPosition(_p2Index);
    var distance = ballPos.distance(goalPos[_getOpponentIndex(playerIndex)]);
    var score = _maxDistance / distance;
    return score;
}

function _rateDistanceToBall(playerIndex, state) {
    var playerPos = [];
    playerPos[_p1Index] = new V2D.Vector2d(state.p1Pos.x, state.p1Pos.y);
    playerPos[_p2Index] = new V2D.Vector2d(state.p2Pos.x, state.p2Pos.y);
    var ballPos = new V2D.Vector2d(state.ballPos.x, state.ballPos.y);
    var distanceScore = _maxDistance / ballPos.distance(playerPos[playerIndex]);
    var orientation = 1;
    var score = 0;
    if (playerPos[playerIndex].y > ballPos.y) {
        if (playerIndex == _p2Index) {
            orientation = -1;
        }
    } else {
        if (playerIndex == _p1Index) {
            orientation = -1;
        }
    }
    if (orientation == 1) {
        return distanceScore;
    } else {
        return 1 - distanceScore;
    }
}

function _getOpponentIndex(playerIndex) {
    if (playerIndex == _p1Index) {
        return _p2Index;
    }
    return _p1Index;
}

function _getTurnList(playerPos) {
    var turnList = [];

    for (var i = 0; i < _radialIterations; i++) {
        for (var j = _strengthIterations; j > 0; j--) {
            var v = _getAngleVector((i + 1) * 2 * Math.PI / _radialIterations);
            var turn = {};
            v.add(playerPos);
            turn.x = v.x;
            turn.y = v.y;
            turn.strength = j / _strengthIterations;
            turn.toString = _turnToString;
            turnList.push(turn);
        }
    }

    return turnList;
}

function _turnToString() {
    return "(" + this.x + ", " + this.y + ", " + this.strength + ")";
}

function _getAngleVector(angle) {
    var result = new V2D.Vector2d(0, 0);
    result.x = Math.cos(angle);
    result.y = Math.sin(angle);
    return result;
}
