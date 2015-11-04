var FADER = (function () {
    // Private
    function inherit(derived, base) {
    	derived.prototype = Object.create(base.prototype);
    	derived.prototype.constructor = derived;
    }

    // Public

    var module = {};

    module.Timer = function() {
          this.timeout = 0;
          this.started = -1;
    }

    module.Timer.prototype.start = function(ms) {
        this.started = new Date().getTime();
        this.timeout = ms;
    }

    module.Timer.prototype.stop = function() {
        this.started = -1;
    }

    module.Timer.prototype.reset = function() {
        this.start(this.timeout);
    }

    module.Timer.prototype.getElapsedTime = function() {
        if (!this.isRunning()) {
            return -1;
        } else {
            return (new Date().getTime()) - this.started;
        }
    }

    module.Timer.prototype.isRunning = function() {
        return this.started != -1;
    }

    module.Timer.prototype.isTimeUp = function() {
        if (!this.isRunning()) {
            return false;
        } else {
            return this.getElapsedTime() >= this.timeout;
        }
    }

    module.Timer.prototype.getProgress = function () {
        if (!this.isRunning()) {
            return 0;
        } else {
            return Math.min(this.getElapsedTime() / this.timeout, 1.0);
        }
    };

    module.Fader = function() {

    }

    inherit(module.Fader, module.Timer);

    module.Fader.prototype.getEasing = function(f) {
        return f(this.getProgress());
    }

    module.EasingFunctions = {
        // no easing, no acceleration
        linear: function (t) { return t },
        // accelerating from zero velocity
        easeInQuad: function (t) { return t*t },
        // decelerating to zero velocity
        easeOutQuad: function (t) { return t*(2-t) },
        // acceleration until halfway, then deceleration
        easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
        // accelerating from zero velocity
        easeInCubic: function (t) { return t*t*t },
        // decelerating to zero velocity
        easeOutCubic: function (t) { return (--t)*t*t+1 },
        // acceleration until halfway, then deceleration
        easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
        // accelerating from zero velocity
        easeInQuart: function (t) { return t*t*t*t },
        // decelerating to zero velocity
        easeOutQuart: function (t) { return 1-(--t)*t*t*t },
        // acceleration until halfway, then deceleration
        easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
        // accelerating from zero velocity
        easeInQuint: function (t) { return t*t*t*t*t },
        // decelerating to zero velocity
        easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
        // acceleration until halfway, then deceleration
        easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
    }

    return module;
}());
