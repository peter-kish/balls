var V2D = require('./sh_vector.js');
var sim = require('./sh_simulation.js');

var _radialIterations = 36;
var _p1Index = 0
var _p2Index = 1
var _fieldSize = sim.getPlayFieldSize();
var _maxDistance = Math.sqrt(Math.pow(_fieldSize.width, 2) + Math.pow(_fieldSize.height, 2));
var _worstScore = Number.MIN_VALUE;
var _bestScore = Number.MAX_VALUE;
var _turnList = _getTurnList();

exports.getTurn = function(playerIndex, state) {
    return _getBestTurn(playerIndex, state, _turnList);
}

function _getBestTurn(playerIndex, state, turns) {
    var simulation = sim.createSimulation(_p1Index, _p2Index);
    var bestScore = _worstScore;
    var bestTurnIndex = 0;

    for (var i = 0; i < turns.length; i++) {
        simulation.setState(state);
        sim.simulateTurn(simulation, playerIndex, turns[i].x, turns[i].y, turns[i].strength);
        var score = _rateState(sim.getState(simulation));
        if (score > bestScore) {
            bestScore = score;
            bestTurnIndex = i;
        }
    }

    return turns[bestTurnIndex];
}

function _rateState(playerIndex, state) {
    var playerPos = [];
    playerPos[_p1Index] = new V2D.Vector2d(state.p1Pos.x, state.p1Pos.y);
    playerPos[_p2Index] = new V2D.Vector2d(state.p2Pos.x, state.p2Pos.y);
    var ballPos = new V2D.Vector2d(state.ballPos.x, state.ballPos.y);
    var goalPos = [];
    goalPos[_p1Index] = sim.getGoalPosition(_p1Index);
    goalPos[_p2Index] = sim.getGoalPosition(_p2Index);
    var distance = ballPos.distance(goalPos[_getOpponentIndex(playerIndex)]);

    return distance / _maxDistance;
}

function _getOpponentIndex(playerIndex) {
    if (playerIndex == _p1Index) {
        return _p2Index;
    }
    return _p1Index;
}

function _getTurnList() {
    var turnList = [];

    for (var i = 0; i < _radialIterations; i++) {
        var v = _getAngleVector(2 * Math.PI / i);
        var turn = {};
        turn.x = v.x;
        turn.y = v.y;
        turn.strength = 1.0;
        turnList.push(turn);
    }

    return turnList;
}

function _getAngleVector(angle) {
    var result = new V2D.Vector2d(0, 0);
    result.x = Math.cos(angle);
    result.y = Math.sin(angle);
    return result;
}
