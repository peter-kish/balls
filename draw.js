var CDRAW = (function () {
	// Private
	var drawRatio = 1.0;
	var context = null;

	// Public
	var module = {}

	module.setCanvas = function(canvas) {
		context = canvas.getContext('2d');
	}

	module.setDrawRatio = function(ratio) {
		drawRatio = ratio;
	}

	module.getDrawRatio = function() {
		return drawRatio;
	}

	module.setAlpha = function(alpha) {
		context.globalAlpha = alpha;
	}

	module.setLineCap = function(linecap) {
		context.lineCap = linecap;
	}

	module.drawLine = function(x1, y1, x2, y2, width, color) {
		x1 *= drawRatio;
		y1 *= drawRatio;
		x2 *= drawRatio;
		y2 *= drawRatio;
		width *= drawRatio;

		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.lineWidth = width;
		context.strokeStyle = color;
		context.stroke();
	}

	module.drawCircle = function(x, y, r, color) {
		x *= drawRatio;
		y *= drawRatio;
		r *= drawRatio;

		context.beginPath();
		context.arc(x, y, r, 0, 2 * Math.PI, false);
		context.fillStyle = color;
		context.fill();
	}

	module.drawCircleOutline = function(x, y, r, width, color) {
		x *= drawRatio;
		y *= drawRatio;
		r *= drawRatio;
		width *= drawRatio;

		context.beginPath();
		context.arc(x, y, r, 0, 2 * Math.PI, false);
		context.lineWidth = width;
		context.strokeStyle = color;
		context.stroke();
	}

	module.drawRect = function(x, y, w, h, color) {
		x *= drawRatio;
		y *= drawRatio;
		w *= drawRatio;
		h *= drawRatio;

		context.beginPath();
		context.rect(x, y, w, h);
		context.fillStyle = color;
		context.fill();
	}

	module.drawRectOutline = function(x, y, w, h, lineWidth, color) {
		x *= drawRatio;
		y *= drawRatio;
		w *= drawRatio;
		h *= drawRatio;

		context.beginPath();
		context.rect(x, y, w, h);
		context.lineWidth = lineWidth;
		context.strokeStyle = color;
		context.stroke();
	}

	module.drawText = function(x, y, text, font, fontSize, color, style, align, baseline) {
		x *= drawRatio;
		y *= drawRatio;
		fontSize *= drawRatio;

		context.font = style + ' ' + fontSize + 'pt ' + font;
		context.fillStyle = color;
		context.textAlign = align;
		context.textBaseline = baseline;
		context.fillText(text, x, y);

		return context.measureText(text);
	}

	module.getTextWidth = function(text, font, fontSize, color, style, align, baseline) {
		context.font = style + ' ' + fontSize + 'pt ' + font;
		context.fillStyle = color;
		context.textAlign = align;
		context.textBaseline = baseline;

		return context.measureText(text).width;
	}

	module.getTextHeight = function(text, font, fontSize, color, style, align, baseline) {
		context.font = style + ' ' + fontSize + 'pt ' + font;
		context.fillStyle = color;
		context.textAlign = align;
		context.textBaseline = baseline;

		return context.measureText(text).height;
	}

	module.loadImage = function(imagePath, callback) {
		var imageObj = new Image();
		imageObj.onload = callback;
		imageObj.src = imagePath;
		return imageObj;
	}

	module.getImageWidth = function(image) {
		if (image)
			return image.naturalWidth;

		return 0;
	}

	module.getImageHeight = function(image) {
		if (image)
			return image.naturalHeight;

		return 0;
	}

	module.drawImage = function(image, x, y, hflip, vflip) {
		x *= drawRatio;
		y *= drawRatio;
		if (!image)
			return;

		if (!hflip)
			hflip = false;
		if (!vflip)
			vflip = false;

		if (hflip) {
			context.scale(-1, 1);
			x = -x - module.getImageWidth(image);
		}
		if (vflip) {
			context.scale(1, -1);
			y = -y - module.getImageWidth(image);
		}

		context.drawImage(image, x, y);

		if (hflip) {
			context.scale(-1, 1);
		}
		if (vflip) {
			context.scale(1, -1);
		}
	}

	module.drawImageResized = function(image, x, y, w, h, hflip, vflip) {
		x *= drawRatio;
		y *= drawRatio;
		w *= drawRatio;
		h *= drawRatio;
		if (!image)
			return;

		if (!hflip)
			hflip = false;
		if (!vflip)
			vflip = false;

		if (hflip) {
			context.scale(-1, 1);
			x = -x;
			w = -w;
		}
		if (vflip) {
			context.scale(1, -1);
			y = -y;
			h = -h;
		}

		context.drawImage(image, x, y, w, h);

		if (hflip) {
			context.scale(-1, 1);
		}
		if (vflip) {
			context.scale(1, -1);
		}
	}

	module.drawImageCropped = function(image, sourceX, sourceY, sourceW, sourceH,
		destX, destY, destW, destH, hflip, vflip) {
		destX *= drawRatio;
		destY *= drawRatio;
		destW *= drawRatio;
		destH *= drawRatio;
		if (!image)
			return;

		if (!hflip)
			hflip = false;
		if (!vflip)
			vflip = false;

		if (hflip) {
			context.scale(-1, 1);
			destX = -destX;
			destW = -destW;
		}
		if (vflip) {
			context.scale(1, -1);
			destY = -destY;
			destH = -destH;
		}

		context.drawImage(image,
			sourceX,
			sourceY,
			sourceW,
			sourceH,
			destX,
			destY,
			destW,
			destH);

		if (hflip) {
			context.scale(-1, 1);
		}
		if (vflip) {
			context.scale(1, -1);
		}
	}

	return module;
}());
