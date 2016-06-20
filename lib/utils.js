//File with used classes and corresponding functions
'use strict';

//Point in 2D space
class Point {
	constructor(x, y) {
		this.x = 0;
		this.y = 0;
		if (x != undefined && y != undefined) {
			this.x = parseFloat(x);
			this.y = parseFloat(y);
		}
	}

	distance(otherPoint) {
		return Math.sqrt(Math.pow(this.x - otherPoint.x, 2) + Math.pow(this.y - otherPoint.y, 2));
	}

	equals(point) {
		return (this.x == point.x && this.y == point.y);
	}
}

//Addition of two points
function addPoint(a, b) {
	return new Point(a.x + b.x, a.y + b.y);
}

//Retraction of two points
function substractPoint(a, b) {
	return new Point(a.x - b.x, a.y - b.y);
}

function stringify(point) {
	return `(${point.x}, ${point.y})`;
}

//Class for rectangular in 2D space
class Box {
	constructor(width, height, centerx, centery) {
		this.width = width;
		this.height = height;
		this.position = new Point(0, 0); //Position of midpoint
		this.min = new Point(-width / 2.0, -height / 2.0);
		this.max = new Point(width / 2.0, height / 2.0);
		if (centerx != undefined && centery != undefined) {
			this.moveToXY(parseFloat(centerx), parseFloat(centery));
		}
	}

	//Return position of center
	getCenter() {
		return this.position;
	}

	//Return corner (0:tl,1:tr,2:dr:3dl,all)
	getCorner(option) {
		if (option == 0 || option == 'tl')
			return new Point(this.min.x, this.max.y);
		else if (option == 1 || option == 'tr')
			return this.max;
		else if (option == 2 || option == 'dr')
			return new Point(this.max.x, this.min.y);
		else if (option == 3 || option == 'dl')
			return this.min;
		else
			return [new Point(this.min.x, this.max.y), this.max, new Point(this.max.x, this.min.y), this.min];
	}

	//Get hull around box (i.e. the corners in order dl, dr, tr, tl)
	getHull() {
		return [this.getCorner('dl'), this.getCorner('dr'), this.getCorner('tr'), this.getCorner('tl')];
	}

	//Move center to point P
	moveTo(p) {
		var diff = new Point();
		diff = substractPoint(p, this.position);
		this.position = p;
		this.min = addPoint(this.min, diff);
		this.max = addPoint(this.max, diff);
	}

	//Move center in x direction
	moveToX(x) {
		var p = new Point(x, this.position.y);
		this.moveTo(p);
	}
	//Move center in y direction
	moveToY(y) {
		var p = new Point(this.position.x, y);
		this.moveTo(p);
	}
	//Move center in x and y direction
	moveToXY(x, y) {
		this.moveToX(x);
		this.moveToY(y);
	}

	stringify() {
		return `${stringify(this.min)} by ${stringify(this.max)}`;
	}
}


module.exports = {
	Box,
	Point,
	addPoint,
	substractPoint,
	stringify
};
