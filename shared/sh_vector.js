(function(exports) {

    exports.Vector2d = function(x, y) {
    	if (x) {
    		this.x = x;
    	} else {
    		this.x = 0;
    	}
    	if (y) {
    		this.y = y;
    	} else {
    		this.y = 0;
    	}
    };

    exports.Vector2d.prototype.set = function (vector) {
    	this.x = vector.x;
    	this.y = vector.y;
        return this;
    };

    exports.Vector2d.prototype.add = function(vector) {
    	this.x += vector.x;
    	this.y += vector.y;
    };

    exports.Vector2d.prototype.sub = function(vector) {
    	this.x -= vector.x;
    	this.y -= vector.y;
    };

    exports.Vector2d.prototype.multiply = function(scalar) {
    	this.x *= scalar;
    	this.y *= scalar;
    };

    exports.Vector2d.prototype.dot = function(vector) {
    	return (this.x * vector.x) + (this.y * vector.y);
    }

    exports.Vector2d.prototype.length = function() {
    	return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }

    exports.Vector2d.prototype.distance = function(vector) {
    	return Math.sqrt(Math.pow(vector.x - this.x, 2) + Math.pow(vector.y - this.y, 2));
    }

    exports.Vector2d.prototype.chebyshevDistance = function(vector) {
      return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
    }

    exports.Vector2d.prototype.projection = function(vector) {
    	var result = new exports.Vector2d(vector.x, vector.y);
    	var scalar = (this.dot(vector)) / (Math.pow(vector.length(), 2));
    	result.multiply(scalar);
    	return result;
    }

    exports.Vector2d.prototype.reflection = function(normal) {
    	var result = (new exports.Vector2d()).set(this);
        var normalMultiplied = (new exports.Vector2d()).set(normal);
        normalMultiplied.multiply(2 * this.dot(normal));
    	result.sub(normalMultiplied);
    	return result;
    }

    exports.Vector2d.prototype.reflect = function(normal) {
    	var reflection = this.reflection(normal);
    	this.set(reflection);
    }

    exports.Vector2d.prototype.normalize = function() {
    	this.multiply(1 / this.length());
    };

    exports.Vector2d.prototype.toString = function(vector) {
    	return '(' + this.x + ',' + this.y + ')';
    }

    exports.Vector2d.prototype.draw = function(center) {
    	drawLine(center.x, center.y, center.x + this.x, center.y + this.y, 3, '#000000')
    }

    exports.Vector2d.prototype.copy = function() {
    	return new Vector2d(this.x, this.y);
    }

    exports.Vector2d.prototype.equals = function (vector) {
    	return (this.x == vector.x && this.y == vector.y);
    };

    exports.add = function(v1, v2) {
    	var result = new exports.Vector2d(v1.x, v1.y);
    	result.add(v2);
    	return result;
    }

    exports.sub = function(v1, v2) {
    	var result = new exports.Vector2d(v1.x, v1.y);
    	result.sub(v2);
    	return result;
    }

    exports.multiply = function(v1, scalar) {
    	var result = new exports.Vector2d(v1.x, v1.y);
    	result.multiply(scalar);
    	return result;
    }

    exports.dot = function(v1, v2) {
    	var result = new exports.Vector2d(v1.x, v1.y);
    	result.dot(v2);
    	return result;
    }

    exports.distance = function(v1, v2) {
    	var result = new exports.Vector2d(v1.x, v1.y);
    	return result.distance(v2);
    }

    exports.projection = function(v1, v2) {
    	return v1.projection(v2);
    }

    exports.reflection = function(v, n) {
        return v.reflection(n);
    }

    exports.normalized = function(v) {
    	var result = new exports.Vector2d(v.x, v.y);
    	result.normalize();
    	return result;
    }

    exports.equal = function(v1, v2) {
    	return v1.equals(v2);
    }

})(typeof exports === 'undefined'? this['V2D']={}: exports);
