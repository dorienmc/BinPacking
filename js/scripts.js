'use strict';
/************************Other Functions*****************/
//Get last element in array
Array.prototype.last = function() {
	return this[this.length - 1];
};


/************************POINT Functions*****************/
//Note: Point2 class is replaced by Vector2() objects

/***************
* Cross product of three points
* If bigger then 0 then p2 is left of p0->p1, if negative its right of the line
* And in case this returns zero all three points are colinear
****************/
function cross(p0, p1, p2) {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

/************************BOX Functions*****************/
/***************
* Get center of box (2D)
* @param: bb, boundingbox, BufferGeometry().boundingBox
* @output: position of center, Vector2() object
****************/
function getCenter(bb) {
	var size = getSize(bb);
	var centerx = bb.min.x + size.x / 2.0;
	var centery = bb.min.y + size.y / 2.0;
	return new THREE.Vector2(centerx, centery);
}

/***************
* Get x and y length of box (2D)
* @param: bb, boundingbox, BufferGeometry().boundingBox
* @output: x and y length, Vector2() object
****************/
function getSize(bb) {
	var width = bb.max.x - bb.min.x;
	var height = bb.max.y - bb.min.y;
	return new THREE.Vector2(width, height);
}

/***************
* Get corner of box
* @param: bb, boundingbox, BufferGeometry().boundingBox
* @param: option, (0:tl,1:tr,2:dr:3dl,all)
* @output: Vector2() or array of Vector2()
****************/
 function getCorner(bb, option) {
	if (option == 0 || option == 'tl')
		return new THREE.Vector2(bb.min.x, bb.max.y);
	else if (option == 1 || option == 'tr')
		return new THREE.Vector2(bb.max.x, bb.max.y);
	else if (option == 2 || option == 'dr')
		return new THREE.Vector2(bb.max.x, bb.min.y);
	else if (option == 3 || option == 'dl')
		return new THREE.Vector2(bb.min.x, bb.min.y);
	else {
		return [getCorner(0), getCorner(1), getCorner(2), getCorner(3)];
	}
}

/***************
* Get hull of box
* @param: bb, boundingbox, BufferGeometry().boundingBox
* @output: array of Vector2()
****************/
function getHull(bb) {
	return [getCorner(bb, 'dl'), getCorner(bb, 'dr'), getCorner(bb, 'tr'), getCorner(bb, 'tl')];
}

/***************
* Move center of box to p
* @param: bb, boundingbox, BufferGeometry().boundingBox
# @param: p, Vector2()
* @output: updated boundingbox
****************/
function moveTo(bb, p) {
	var diff = getCenter(bb);
	diff.sub(p);
	return {min: bb.min.add(diff), max: bb.max.add(diff)};
}

/************************Bed Functions*****************/
/***************
* Return center of bed
* @param: bed, json object
* @output: Vector2()
****************/
function getBedCenter(bed) {
	if (bed.printerType == 'DELTA' || bed.placeOfOrigin == 'CENTER')
		return new THREE.Vector2(0, 0);
	else {
		return new THREE.Vector2(bed.xLength / 2.0, bed.yLength / 2.0);
	}
}

/***************
* Return outline of bed
* @param: bed, json object
* @output: array of Vector2()
****************/
function getOutline(bed) {
	if (bed.hasOwnProperty('outline')) {
		return bed.outline;
	}
	else {
		if (bed.printerType == 'CARTESIAN') {
			var box = {min: new THREE.Vector2(0, 0), max: new THREE.Vector2(bed.xLength, bed.yLength)};
			box = moveTo(box, getBedCenter(bed));
			return getHull(box);
		}
		else {
			var c_angle = 2 * Math.PI;
			var outline = [];
			while (c_angle > 0) {
				var px = this.radius * Math.sin(c_angle);
				var py = this.radius * Math.cos(c_angle);
				var p = new THREE.Vector2(px, py);
				outline.push(p);
				c_angle -= 0.2;
			}
		}
	}
}

/***************
* Set outline of bed, as new parameter in bed
* @param: bed, json object
* @output: updated bed
****************/
function setOutline(bed) {
	bed.outline = getOutline(bed);
	return bed;
}

/***************
* Set margin between models on bed,
* eg. all models should be placed at least this far from each other
* @param: bed, json object
* @output: updated bed
****************/
function setMargin(bed, margin) {
	bed.margin = margin;
	return bed;
}

/***************
* Get margin between boxes
* @param: bed, json object
* Margin is set to 1 by default
****************/
function getMargin(bed){
	if(!bed.hasOwnProperty('margin') || bed.margin == undefined){
		bed.margin = 1;
	}
	return bed.margin;
}

/***************
* Check if bed is empty
* @param: bed, json object
****************/
function isEmpty(bed) {
	if (!bed.hasOwnProperty('boxes') || bed.boxes.length == 0) {
		return true;
	}
	return false;
}

/***************
* Get last added box on bed
* @param: bed, json object
****************/
function getLastBox(bed) {
	if (isEmpty(bed))
		return undefined;
	else {
		return bed.boxes.slice(-1).pop();
	}
}

/***************
* Remove last added box on bed
* @param: bed, json object
****************/
function removeBox() {
	if (!isEmpty(bed)) {
		bed.boxes.pop();
	}
	return bed;
}

/***************
* Add new box at given position
* @param: bed, json object
* @param: box
* @param: position, Vector2()
****************/
function addBoxAtPosition(bed, bb, position) {
	var box = moveTo(bb, position);
	if (isEmpty(bed)) {
		bed.boxes = [box];
	}
	else{
		bed.boxes.push(box);
	}
	return bed;
}

/***************
* Check if box collides with one of the other boxes on the bed
* @param: bed, json object
* @param: box, json object
****************/
function collides(bed, boxes){
	if(isEmpty(bed)){
		return false;
	}

	for (var i = 0; i < bed.boxes.length; i++) {
		if (insideHull(box, getHull(bed.boxes[i])) >= 0) {
			return true;
		}
	}
	return false;
}

/***************
* Check if box fits on bed
* @param: bed, json object
* @param: box, json object
****************/
function isOnBed(bed, box) {
	return (insideHull(box, getOutline(bed)) >= 0);
}

/***************
* Check if box can be placed at the given position on the bed
* @param: bed, json object
* @param: box, json object
* @param: position, Vector2()
****************/
function canPlaceAt(bed, box, position){
	//Box can be placed at position if it fits on the bed and doesnt collide with any other boxes
	var newBox = moveTo(box, position);
	return (isOnBed(bed, newBox) && !this.collides(bed, newBox));
}

/**
* Try to place new box (left/right/below/above of the given box)
* @param: bed, json object
* @param place: left/right/below/above, newBox: box to be placed, oldBox: box already on bed
* @param: newBox, json object
* @param: oldBox, json object
*/
function tryAt(bed, place, newBox, oldBox) {
	 //Get distance between midpoint of new and old box
	 var sizeOldBox = getSize(oldBox);
	 var sizeNewBox = getSize(newBox);
	 var margin = getMargin(bed);
	 var hdist = 0.5 * (sizeOldBox.x + sizeNewBox.x) + margin;
	 var vdist = 0.5 * (sizeOldBox.y + sizeOldBox.y) + margin;
	 var oldCenter = getCenter(oldBox);

	 //Get position of midpoint for new box
	 if (place == 'left') {
		 var position = new THREE.Vector2(oldCenter.x - hdist, oldCenter.y);
	 }
	 else if (place == 'right') {
		 var position = new THREE.Vector2(oldCenter.x + hdist, oldCenter.y);
	 }
	 else if (place == 'above') {
		 var position = new THREE.Vector2(oldCenter.x, oldCenter.y + vdist);
	 }
	 else if (place == 'below') {
		 var position = new THREE.Vector2(oldCenter.x, oldCenter.y - vdist);
	 }
	 else {
		 return undefined;
	 }

	 //Check if new box can be placed at 'postion'
	 if (canPlaceAt(bed, newBox, position)) {
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

function addBoxToBed(bed, newBox) {
	//Spiral strategy: Add boxes using 'bed.tryAt', priority of directions is above,left,below,right
	var strategy = ['above', 'left', 'below', 'right'];

	//Add first box in center
	if (isEmpty(bed)) {
		if (canPlaceAt(bed, newBox, getCenter(bed))) {
			//Place box
			bed = addBoxAtPosition(bed, newBox, getCenter(bed));
			return getCenter(bed);
		}
		return undefined;
	}

	//Try directions

	for (var i = 0; i < strategy.length; i++) {
		var position = tryAt(bed, strategy[i], newBox, getLastBox(bed));
		if (position != undefined) {
			bed = addBoxAtPosition(bed, newBox, position);
			return position;
		}
	}
	return undefined;
}

/************************Convex hull Functions*****************/
/**
* Monotone chain algorithm for find the convex hull of a set of points
* @param points An array of Vector2() objects
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
 * @param points An array of box json objects
 */
 function convexHullBox(boxes) {
	 //Get all corners of the boxes
	 var points = [];
	 for (var i = 0; i < boxes.length; i++) {
		 points = points.concat(getCorner(boxes[i], 'all'));
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
* @param obj a Vector2() or box json object
* Returns 1 if inside, 0 if on and -1 if (partly) outside of the given hull
*/
function insideHull(obj, hull) {
	var points = [];
	if (obj.hasOwnProperty('min')) {
		points = getCorner(obj, 'all');
	}
	else {
		points.push(obj);
	}

	var pointsOnEdge = 0;
	for (var i = 0; i < points.length; i++) {
		//Loop over all the edges of the convex hull, if the point is left of all of them then it is inside
		for (var j = 0; j < hull.length; j++) {
			var tmp = cross(hull[j], hull[(j + 1) % hull.length], points[i]);
			if (tmp < 0) {
				return -1;
			}
			else if (tmp == 0) { //Check if point is on the line segment hull[j]->hull[j+1]
				if (points[i].x < Math.min(hull[j].x, hull[(j + 1) % hull.length].x) ||
				points[i].x > Math.max(hull[j].x, hull[(j + 1) % hull.length].x) ||
				points[i].y < Math.min(hull[j].y, hull[(j + 1) % hull.length].y) ||
				points[i].y > Math.max(hull[j].y, hull[(j + 1) % hull.length].y)) {
					return -1;
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
