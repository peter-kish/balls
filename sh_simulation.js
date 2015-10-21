(function(exports) {
    var V2D = null;
    if (typeof this.V2D == 'undefined') {
        V2D = require('./sh_vector.js');
    } else {
        V2D = this.V2D;
    }

    // Private

    // Physics constants
    var drag = 0.02;
    var epsilon = 0.01;
    var stoppingEpsilon = 0.1;
    var bounce = 1.0;
    var movementForce = 8.0;
    // Other constants
    var playerRadius = 20;
    var ballRadius = 20;
    var goalPostRadius = 10;
    var goalSize = 200;

    var simFrame = {
    	width: 480,
    	height: 640
    }

    // Circle-rectangle collision
    function CRCollision(cx, cy, cr, rx, ry, rw, rh) {
    	var cdx = Math.abs(cx - (rx+rw/2));
        var cdy = Math.abs(cy - (ry+rh/2));

        if (cdx > (rw/2 + cr)) { return false; }
        if (cdy > (rh/2 + cr)) { return false; }

        if (cdx <= (rw/2)) { return true; }
        if (cdy <= (rh/2)) { return true; }

        var cornerDistance_sq = Math.pow((cdx - rw/2), 2) +
                             Math.pow((cdy - rh/2), 2);

        return (cornerDistance_sq <= (Math.pow(cr, 2)));
    }

    function pointInRect(px, py, rx, ry, rw, rh) {
    	if ((px >= rx) && (px <= rx + rw) && (py >= ry) && (py <= ry + rh))
    	{
    		return true;
    	}
    	return false;
    }

    // Ball class
    var Ball = function(id, x, y, radius) {
    	this.position = new V2D.Vector2d(x, y);
    	this.velocity = new V2D.Vector2d(0, 0);
    	this.radius = radius;
    	this.solid = false;
        this.id = id;
        this.marked = false;
    };

    Ball.prototype.update = function() {
    	if (!this.solid) {
    		//this.position.add(V2D.multiply(this.velocity, fps.animDelta));
    		this.position.add(this.velocity);
    		this.velocity.multiply(1.0 - drag);

    		if (this.position.y + this.radius > simFrame.height) {
    			this.position.y = simFrame.height - this.radius;
    			this.velocity.y *= -bounce;
    		}
    		if (this.position.y - this.radius < 0) {
    			this.position.y = this.radius;
    			this.velocity.y *= -bounce;
    		}
    		if (this.position.x + this.radius > simFrame.width) {
    			this.position.x = simFrame.width - this.radius;
    			this.velocity.x *= -bounce;
    		}
    		if (this.position.x - this.radius < 0) {
    			this.position.x = this.radius;
    			this.velocity.x *= -bounce;
    		}

    		if (this.velocity.length() < stoppingEpsilon) {
    			this.velocity.x = 0.0;
    			this.velocity.y = 0.0;
    		}
    	} else {
    		this.velocity.x = 0.0;
    		this.velocity.y = 0.0;
    	}
    };

    Ball.prototype.applyForce = function(force) {
    	this.velocity.add(force);
    };

    Ball.prototype.isMoving = function() {
    	if (this.solid)
    		return false;
    	return (this.velocity.length() > epsilon);
    }

    Ball.prototype.freeze = function() {
        this.velocity.x = 0.0;
        this.velocity.y = 0.0;
    }

    Simulation = function(id1, id2) {
        this.balls = [];
        this.playBall = null;
        this.playerBall = [];
        this.playerScore = [];
        this.currentTurn = 0;
        this.idle = true;

        this.playerBall[0] = this.createBall(id1, simFrame.width / 2, simFrame.height * 3 / 4, ballRadius);
        this.playerBall[0].marked = true;
        this.playerBall[1] = this.createBall(id2, simFrame.width / 2, simFrame.height / 4, ballRadius);
        this.playBall = this.createBall("", simFrame.width / 2, simFrame.height / 2, ballRadius);
        this.createSolidBall(simFrame.width/2 - goalSize/2, goalPostRadius, goalPostRadius);
        this.createSolidBall(simFrame.width/2 + goalSize/2, goalPostRadius, goalPostRadius);
        this.createSolidBall(simFrame.width/2 - goalSize/2, simFrame.height - goalPostRadius, goalPostRadius);
        this.createSolidBall(simFrame.width/2 + goalSize/2, simFrame.height - goalPostRadius, goalPostRadius);
        this.playerScore[0] = 0;
        this.playerScore[1] = 0;
    }

    Simulation.prototype.resetPlayers = function () {
        this.playerBall[0].position = new V2D.Vector2d(simFrame.width / 2, simFrame.height * 3 / 4);
        this.playerBall[1].position = new V2D.Vector2d(simFrame.width / 2, simFrame.height / 4);
        this.playerBall[0].velocity = new V2D.Vector2d(0, 0);
        this.playerBall[1].velocity = new V2D.Vector2d(0, 0);
        this.playBall.position = new V2D.Vector2d(simFrame.width / 2, simFrame.height / 2);
        this.playBall.velocity = new V2D.Vector2d(0, 0);
    };

    Simulation.prototype.createBall = function (id, x, y, radius) {
        if (x > 0 && x < simFrame.width && y > 0 && y < simFrame.height)
    	{
    		var newBall = new Ball(id, x, y, radius);
    		this.balls.push(newBall);
    		return newBall;
    	}
    };

    Simulation.prototype.createSolidBall = function (x, y, radius) {
        var newBall = this.createBall("", x, y, radius);
    	if (newBall) {
    		newBall.solid = true;
    	}
    	return newBall;
    };

    Simulation.prototype.getBall = function (id) {
        for (var i = 0; i < this.balls.length; i++) {
            if (this.balls[i].id == id) {
                return this.balls[i];
            }
        }
        return null;
    };

    Simulation.prototype.kickBall = function (ball, x, y, strength) {
        var mousePos = new V2D.Vector2d(x, y);
        strength = Math.max(0, strength);
        strength = Math.min(1.0, strength);
        var force = movementForce * strength;
        ball.applyForce(V2D.multiply(V2D.normalized(V2D.add(mousePos, V2D.multiply(ball.position, -1))), force));
    };

    Simulation.prototype.areAllBallsIdle = function () {
        for(var i = 0; i < this.balls.length; i++) {
    		if (this.balls[i].isMoving()) {
    			return false;
    		}
    	}
    	return true;
    };

    Simulation.prototype.freeze = function () {
        for(var i = 0; i < this.balls.length; i++) {
    		this.balls[i].freeze();
    	}
    };

    Simulation.prototype.checkVictory = function (ball) {
        // Collision with a goal
    	if (CRCollision(ball.position.x, ball.position.y, ball.radius, simFrame.width/2 - goalSize/2, 0, goalSize, goalPostRadius)) {
    		return 0;
    	}
    	if (CRCollision(ball.position.x, ball.position.y, ball.radius, simFrame.width/2 - goalSize/2, simFrame.height - goalPostRadius, goalSize, goalPostRadius)) {
    		return 1;
    	}

    	return -1;
    };

    Simulation.prototype.update = function () {
        for (var i = 0; i < this.balls.length; i++) {
            this.balls[i].update();
        }

        // Calculate collisions
    	for(var i = 0; i < this.balls.length; i++) {
    		for(var j = 0; j < this.balls.length; j++) {
    			if (i != j) {
    				if (this.balls[i].position.distance(this.balls[j].position) < this.balls[i].radius + this.balls[j].radius) {
    					// Balls i and j are colliding
    					//log('Balls ' + i + ' and ' + j + ' are colliding');

    					// Resolve the collision
    					var delta = V2D.add(this.balls[i].position, V2D.multiply(this.balls[j].position, -1.0)); // i - j
    					var distance = delta.length();
    					delta.normalize();
    					delta.multiply((this.balls[j].radius + this.balls[i].radius - distance) * (-1.0) * (1 + epsilon));
    					//log('Old positions: ' + this.balls[i].position.toString() + this.balls[j].position.toString() + ' | distance: ' + distance);
    					//log('Resolving with ' + delta.toString() + ' | length: ' + delta.length());
    					if (!this.balls[j].solid) {
    						this.balls[j].position.add(delta);
    					}
    					delta.multiply(-1.0);
    					if (!this.balls[i].solid) {
    						this.balls[i].position.add(delta);
    					}
    					//log('New positions: ' + this.balls[i].position.toString() + this.balls[j].position.toString() + ' | distance: ' + distance);

    					//Apply forces
    					var iProjection = V2D.projection(this.balls[i].velocity, delta);
    					var jProjection = V2D.projection(this.balls[j].velocity, delta);

    					//log('Velocities: ' + this.balls[i].velocity.toString() + ' and ' + this.balls[j].velocity.toString() + '. Projection: ' + iProjection.toString());
    					//log('Applying force ' + iProjection.toString() + 'to ball ' + j);

    					if (!this.balls[j].solid) {
    						this.balls[j].applyForce(iProjection);
    					} else {
    						//log("Ball "+j+" is solid!");
    						this.balls[i].applyForce(V2D.multiply(iProjection, -1.0));
    					}
    					iProjection.multiply(-1.0);
    					//log('Applying force ' + iProjection.toString() + 'to ball ' + i);
    					if (!this.balls[i].solid) {
    						this.balls[i].applyForce(iProjection);
    					} else {
    						//log("Ball "+i+" is solid!");
    						this.balls[j].applyForce(V2D.multiply(iProjection, -1.0));
    					}

    					//log('Applying force ' + jProjection.toString() + 'to ball ' + i);
    					if (!this.balls[i].solid) {
    						this.balls[i].applyForce(jProjection);
    					} else {
    						//log("Ball "+i+" is solid!");
    						this.balls[j].applyForce(V2D.multiply(jProjection, -1.0));
    					}
    					jProjection.multiply(-1.0);
    					//log('Applying force ' + jProjection.toString() + 'to ball ' + j);
    					if (!this.balls[j].solid) {
    						this.balls[j].applyForce(jProjection);
    					} else {
    						//log("Ball "+j+" is solid!");
    						this.balls[i].applyForce(V2D.multiply(jProjection, -1.0));
    					}
    				}
    			}
    		}
    	}

        var victory = this.checkVictory(this.playBall);
        if (victory >= 0) {
            this.resetPlayers();
            this.playerScore[victory]++;
        }

        if (this.areAllBallsIdle()) {
            if (!this.idle) {
                this.idle = true;
                this.onStateChanged(this.idle);
            }
        } else {
            if (this.idle) {
                this.idle = false;
                this.onStateChanged(this.idle);
            }
        }

        return victory;
    };

    Simulation.prototype.onStateChanged = function (idle) {
        if (idle)
            this.switchTurns();
    };

    Simulation.prototype.switchTurns = function () {
        if (this.currentTurn == 0) {
            this.currentTurn = 1;
        } else {
            this.currentTurn = 0;
        }
        this.playerBall[0].marked = false;
        this.playerBall[1].marked = false;
        this.playerBall[this.currentTurn].marked = true;
        if (exports.onTurnStart) exports.onTurnStart(this.playerBall[this.currentTurn].id);
    };

    // Public

    exports.onTurnStart = null;

    exports.createSimulation = function(id1, id2) {
        var sim = new Simulation(id1, id2);
        if (exports.onTurnStart) exports.onTurnStart(sim.playerBall[sim.currentTurn].id);
        return sim;
    }

    exports.simulateTurn = function(sim, id, x, y, strength) {
        if (exports.isTurnValid(sim, id, x, y)) {
            sim.kickBall(sim.playerBall[sim.currentTurn], x, y, strength);
            var tickCount = 0;
            var victory = -1;
            while (!sim.areAllBallsIdle()) {
                victory = sim.update();
                tickCount++;
            }

            var state = exports.getState(sim);
            state.tickCount = tickCount;
            if (victory == 0 || victory == 1) {
                state.victoryID = sim.playerBall[victory].id;
            } else {
                state.victoryID = "";
            }

            return state;
        }
        return null;
    }

    exports.step = function(sim) {
        sim.update();
    }

    exports.stepUntilFinished = function(sim) {
        while (!sim.areAllBallsIdle()) {
            sim.update();
        }
    }

    exports.isIdle = function(sim) {
        return sim.areAllBallsIdle();
    }

    exports.getState = function (sim) {
        var state = {};
        state.p1Pos = new V2D.Vector2d(sim.playerBall[0].position.x, sim.playerBall[0].position.y);
        state.p1Score = sim.playerScore[0]
        state.p2Pos = new V2D.Vector2d(sim.playerBall[1].position.x, sim.playerBall[1].position.y);
        state.p2Score = sim.playerScore[1]
        state.ballPos = new V2D.Vector2d(sim.playBall.position.x, sim.playBall.position.y);
        return state;
    }

    exports.setState = function (sim, state) {
        sim.freeze();
        sim.playerScore[0] = state.p1Score;
        sim.playerScore[1] = state.p2Score;
        sim.playerBall[0].position.set(state.p1Pos);
        sim.playerBall[1].position.set(state.p2Pos);
        sim.playBall.position.set(state.ballPos);
    }

    exports.turn = function(sim, id, x, y, strength) {
        if (exports.isTurnValid(sim, id, x, y, strength)) {
            sim.kickBall(sim.playerBall[sim.currentTurn], x, y, strength);

            return true;
        }
        return false;
    }

    exports.isTurnValid = function(sim, id, x, y, strength) {
        if (sim.playerBall[sim.currentTurn].id == id && sim.areAllBallsIdle()) {
            return true
        }
        return false;
    }

})(typeof exports === 'undefined'? this['SIM']={}: exports);
