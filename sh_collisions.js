(function(exports) {
    var V2D = null;
    if (typeof this.V2D == 'undefined') {
        V2D = require('./sh_vector.js');
    } else {
        V2D = this.V2D;
    }

    // Circle-rectangle collision
    exports.CRCollision = function (cx, cy, cr, rx, ry, rw, rh) {
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

    exports.pointInRect = function (px, py, rx, ry, rw, rh) {
    	if ((px >= rx) && (px <= rx + rw) && (py >= ry) && (py <= ry + rh))
    	{
    		return true;
    	}
    	return false;
    }

    exports.Circle = function (origin, radius) {
        this.origin = origin;
        this.radius = radius;
    }

    exports.Circle.prototype.contains = function (point) {
        return (this.origin.distance(point) < this.radius);
    };

    exports.Rect = function (x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    exports.Rect.prototype.contains = function (point) {
        return exports.pointInRect(point.x, point.y, this.x, this.y, this.w, this.h);
    };

    exports.RoundCorner = function (rect, circle) {
        this.rect = rect;
        this.circle = circle;
    };

    exports.RoundCorner.prototype.updateWithBall = function (ball) {
        if (this.collidesWith(ball)) {
            this.resolveCollision(ball);
        }
    };

    exports.RoundCorner.prototype.collidesWith = function (ball) {
        if (this.rect.contains(ball.circle.origin) && ball.circle.origin.distance(this.circle.origin) > this.circle.radius - ball.circle.radius) {
            return true;
        }
        return false;
    };

    exports.RoundCorner.prototype.resolveCollision = function (ball) {
        var n = V2D.sub(this.circle.origin, ball.circle.origin);
        n.normalize();
        ball.circle.origin.add(V2D.multiply(n, ball.circle.origin.distance(this.circle.origin) + ball.circle.radius - this.circle.radius));
        ball.velocity.reflect(n);
    };

})(typeof exports === 'undefined'? this['CLL']={}: exports);
