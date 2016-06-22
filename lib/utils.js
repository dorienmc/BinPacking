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

	equals(otherBox) {
		return (this.width == otherBox.width && this.height == otherBox.height
			&& this.position.equals(otherBox.position));
	}
}

/*
Convert THREE.Box2() to Box object
*/
function Box2ToBox(box) {
	var width = box.max.x - box.min.x;
	var height = box.max.y - box.min.y;
	var centerx = box.min.x + width / 2.0;
	var centery = box.min.y + height / 2.0;
	return new Box(width, height, centerx, centery);
}

/**
 * Build plate
 * @param positionOrigin: 'corner' or 'center', shape: 'rectangular' or 'round', width
 */
class Bed {
	constructor(positionOrigin, shape, width, height) {//height is undefined for round beds, width is the diameter of a round bed
		this.margin = 1;
		this.boxes = [];
		this.shape = shape;
		if (shape == 'round') {
			//Set radius
			this.radius = parseFloat(width) / 2.0;
			//Set position of center to origin (round bed cannot have origin at corner as it has no corners)
			this.center = new Point(0, 0);
		}
		else {
			//Set width and height
			this.width = parseFloat(width);
			this.height = parseFloat(height);

			//Set position of center
			//origin in corner -> center at (width/2,height/2)
			//while origin in center means center is at (0, 0)
			if (positionOrigin == 'corner')
				this.center = new Point(this.width / 2.0, this.height / 2.0);
			else
				this.center = new Point();
		}

		//Set outline of bed
		this.setOutline();
	}

	setMargin(number) {
		this.margin = number;
	}

	setOutline() {
		this.outline = [];
		if (this.shape == 'rectangular') {
			var tmp = new Box(this.width, this.height, this.center.x, this.center.y);
			this.outline = this.outline.concat(tmp.getHull());
		}
		else {//round (center == origin by default)
			var c_angle = 2 * Math.PI;
			while (c_angle > 0) {
				var px = this.radius * Math.sin(c_angle);
				var py = this.radius * Math.cos(c_angle);
				var p = new Point(px, py);
				this.outline.push(p);
				c_angle -= 0.2;
			}
		}
	}

	getOutline() {
		return this.outline;
	}

	//Returns true if box is on the bed
	isOnBed(box) {
		return (insideHull(box, this.outline) >= 0);
	}

	getBoxes() {
		return this.boxes;
	}

	getLastBox() {
		if (this.isEmpty()) {
			return undefined;
		}
		else {
			return this.boxes.slice(-1).pop();
		}
	}

	isEmpty() {
		return (this.getBoxes().length == 0);
	}

	getCenter() {
		return this.center;
	}

	addBoxAtPosition(box, position) {
		box.moveTo(position);
		this.boxes.push(box);
	}

	//Remove last box (returns box object)
	removeBox() {
		return this.boxes.pop();
	}

	//True if box collides with one of the other boxes on the bed
	collides(box) {
		if (this.isEmpty())
			return false;

		for (var i = 0; i < this.boxes.length; i++) {
			//Check if boxes are the same (then outsideHull will return)
			if (box.equals(this.boxes[i])) {
				return true;
			}

			if (!outsideHull(box, this.boxes[i].getHull())) {
				return true;
			}
		}
		return false;
	}

	canPlaceAt(box, position) {
		//Box can be placed at position if it fits on the bed and doesnt collide with any other boxes
		box.moveTo(position);
		//console.log('Box outline', box.getHull(), 'Box fits on bed?', this.isOnBed(box));
		//console.log('And does it collide with other boxes?', this.collides(box));
		return (this.isOnBed(box) && !this.collides(box));
	}

	/**
	 * Try to place new box (left/right/below/above of the given box)
	 * @param place: left/right/below/above, newBox: box to be placed, oldBox: box already on bed
	 */
	 tryAt(place, newBox, oldBox) {
		 //Get distance between midpoint of new and old box
		 var hdist = 0.5 * (oldBox.width + newBox.width) + this.margin;
		 var vdist = 0.5 * (oldBox.height + newBox.height) + this.margin;

		 //Get position of midpoint for new box
		 if (place == 'left') {
			 var position = new Point(oldBox.getCenter().x - hdist, oldBox.getCenter().y);
		 }
		 else if (place == 'right') {
			 var position = new Point(oldBox.getCenter().x + hdist, oldBox.getCenter().y);
		 }
		 else if (place == 'above') {
			 var position = new Point(oldBox.getCenter().x, oldBox.getCenter().y + vdist);
		 }
		 else if (place == 'below') {
			 var position = new Point(oldBox.getCenter().x, oldBox.getCenter().y - vdist);
		 }
		 else {
			 return undefined;
		 }

		 //Check if new box can be placed at 'postion'
		 if (this.canPlaceAt(newBox, position)) {
			 return position;
		 }
		 else {
			 return undefined;
		 }
	 }

	 /**
	  * Add box on build plate, current strategy 'spiral'
	  * @param bed: newBox: box to add
	  * Returns position if box is placed and undefined otherwise.
	  */

	 addBox(newBox) {
		//Spiral strategy: Add boxes using 'bed.tryAt', priority of directions is above,left,below,right
		var strategy = ['above', 'left', 'below', 'right'];

		//Add first box in center
		if (this.isEmpty()) {
			if (this.canPlaceAt(newBox, this.getCenter())) {
				//Place box
				this.addBoxAtPosition(newBox, this.getCenter());
				return this.getCenter();
			}
			return undefined;
		}

		//Try directions

		for (var i = 0; i < strategy.length; i++) {
			var position = this.tryAt(strategy[i], newBox, this.getLastBox());
			if (position != undefined) {
				this.addBoxAtPosition(newBox, position);
				return position;
			}
		}
		return undefined;
	}

}

//Get last element in array
Array.prototype.last = function() {
	return this[this.length - 1];
};

//Cross product of three points
//If bigger then 0 then p2 is left of p0->p1, if negative its right of the line
//And in case this returns zero all three points are colinear
function cross(p0, p1, p2) {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

/**
 * Monotone chain algorithm for find the convex hull of a set of points
 * @param points An array of Point objects
 */
function convexHull(points) {
	points.sort(function(a, b) {
		return a.x == b.x ? a.y - b.y : a.x - b.x;
	});

	var lower = [];
	for (var i = 0; i < points.length; i++) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
			lower.pop();
		}
		lower.push(points[i]);
	}

	var upper = [];
	for (var i = points.length - 1; i >= 0; i--) {
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
			upper.pop();
		}
		upper.push(points[i]);
	}

	upper.pop();
	lower.pop();
	return lower.concat(upper);
}


/**
 * Monotone chain algorithm for find the convex hull of a set of boxes
 * @param points An array of Box objects
 */
 function convexHullBox(boxes) {
	 //Get all corners of the boxes
	 var points = [];
	 for (var i = 0; i < boxes.length; i++) {
		 points = points.concat(boxes[i].getCorner());
	 }

	 //Sort them on x and then on y coordinate
	 points.sort(function(a, b) {
		 return a.x == b.x ? a.y - b.y : a.x - b.x;
	 });

	 //Remove duplicate points
	 var unique_points = [points[0]];
	 for (var i = 1; i < points.length; i++) {
		 if (points[i].equals(unique_points.last)) {
			 continue;
		 }
		 else {
			 unique_points.push(points[i]);
		 }
	 }
	 //Run convexHull for points
	 return convexHull(unique_points);
 }

/**
* Determines if point or box is inside hull
* @param obj a Point or Box objects
* Returns 1 if inside, 0 if on and -1 if (partly) outside of the given hull
*/
function insideHull(obj, hull) {
	var points = [];
	if (obj.constructor.name == 'Box') {
		points = obj.getCorner();
	}
	else if (obj.constructor.name == 'Point') {
		points.push(obj);
	}
	else {
		return;
	}

	var pointsOnEdge = 0;
	for (var i = 0; i < points.length; i++) {
		//Loop over all the edges of the convex hull, if the point is left of all of them then it is inside
		for (var j = 0; j < hull.length; j++) {
			var tmp = cross(hull[j], hull[(j + 1) % hull.length], points[i]);
			if (tmp < 0) {//Point is to the right of the current edge, hence not inside hull
				return -1;
			}
			else if (tmp == 0) { //Check if point is on the line segment hull[j]->hull[j+1]
				if (points[i].x < Math.min(hull[j].x, hull[(j + 1) % hull.length].x) ||
				points[i].x > Math.max(hull[j].x, hull[(j + 1) % hull.length].x) ||
				points[i].y < Math.min(hull[j].y, hull[(j + 1) % hull.length].y) ||
				points[i].y > Math.max(hull[j].y, hull[(j + 1) % hull.length].y)) {
					return -1; //Point is on line through hull[j]->hull[j+1] but not between them, hence its outside the hull
				}
				else {
					pointsOnEdge += 1;
					//console.log('Point ', utils.stringify(points[i]), 'lies on an edge');
					break;
				}
			}
		}
	}
	return (pointsOnEdge == points.length ? 0 : 1);
}

/**
* Determines if point or box is outside hull
* @param obj a Point or Box objects
* Returns true if completely not inside hull (can touch it)
*/
function outsideHull(obj, hull) {
	var points = [];
	if (obj.constructor.name == 'Box') {
		points = obj.getCorner();
	}
	else if (obj.constructor.name == 'Point') {
		points.push(obj);
	}
	else {
		return;
	}

	for (var i = 0; i < points.length; i++) {
		//Loop over all the edges of the convex hull, if the point is right of at least one edge its outside the hull
		var nLeft = 0;
		for (var j = 0; j < hull.length; j++) {
			var tmp = cross(hull[j], hull[(j + 1) % hull.length], points[i]);
			if (tmp > 0) {
				nLeft += 1;
			}
		}
		if (nLeft == 4) {
			return false;
		}
	}

	//Also check if hull is completely inside the box, that is neither allowed
	if (obj.constructor.name == 'Box') {
		for (var k = 0; k < hull.length; k++) {
			//console.log(`${stringify(hull[k])} inside box ${obj.stringify()}?`, insideHull(hull[k], obj.getHull()));
			if (insideHull(hull[k], obj.getHull()) >= 0)
				return false;
		}
	}

	return true;
}


module.exports = {
	Box,
	Point,
	addPoint,
	substractPoint,
	stringify,
	Box2ToBox,
	Bed,
	convexHull,
	convexHullBox,
	insideHull,
	outsideHull
};
