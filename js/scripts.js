'use strict';
/************************MAIN Functions*****************/
//Note 1: all box/model/boundingbox objects are json objects of the form
// {min: THREE.Vector3(), max: THREE.Vector3()} (or Vector2())
//Which is also the output of BufferGeometry().boundingbox

//Note 2: the bed is a json object with at least the parameters:
// printerType: either 'CARTESIAN' or 'DELTA'
// placeOfOrigin: either 'CORNER' or 'CENTER' (only 'CENTER' for delta printers)
// xLength: int or float (diameter for delta printerss)
// yLength: int or float (or undefined for delta printers)
//More parameters like 'outline' and 'boxes' will be added to this object

/**
 * Add new model to bed
 * @param new_model: json object representing the 2D bounding box around the new model
 * @param current_models: array of json objects representing the models already on the bed
 * @param bed: json object (see Note 2)
 * @param margin: minimal distance between models (set to 1 if undefined, uses same units as xLength)
 */
function addBox(bed, new_model, current_models, margin) {
	//Check input
	if (!new_model) { console.log('New model not found'); return undefined;}
	if (!new_model.hasOwnProperty('min')) { console.log('new_model.min not found'); return undefined;}
	if (!new_model.hasOwnProperty('max')) { console.log('new_model.max not found'); return undefined;}
	if (!bed) { console.log('Bed not found'); return undefined;}
	if (!bed.hasOwnProperty('printerType')) { console.log('bed.printerType not found'); return undefined;}
	if (!(bed.printerType == 'CARTESIAN' || bed.printerType == 'DELTA')) {
		console.log('bed.printerType should be either \'CARTESIAN\' or \'DELTA\'');
		return undefined;
	}
	if (!bed.hasOwnProperty('placeOfOrigin')) { console.log('bed.placeOfOrigin not found'); return undefined;}
	if (!(bed.placeOfOrigin == 'CORNER' || bed.placeOfOrigin == 'CENTER')) {
		console.log('bed.placeOfOrigin should be either \'CORNER\' or \'CENTER\'');
		return undefined;
	}
	if (!bed.hasOwnProperty('xLength')) { console.log('bed.xLength not found'); return undefined;}
	if (!(bed.printerType == 'DELTA' || bed.hasOwnProperty('yLength'))) {
		console.log('bed.yLength not found');
		return undefined;
	} //only needed for cartesian printers
	if (current_models == undefined)
		current_models = [];

	//Set bed margin (if required)
	if (margin != undefined)
		setMargin(bed, margin);

	//Place current models
	for (var i = 0; i < current_models.length; i++) {
		addBoxAtPosition(bed, current_models[i], getCenter(current_models[i]));
	}
	console.log(bed.boxes);

	//Find position for new box
	var position = addBoxToBed(bed, new_model);

	//Return position, if there is one
	if (position != undefined) {
		return new THREE.Vector2(position.x,position.y);
	}
	else {
		return undefined;
	}
}


/************************Other Functions*****************/
//Get last element in array
Array.prototype.last = function() {
	return this[this.length - 1];
};

/************************POINT Functions*****************/
//Note: Point2 class is replaced by Vector2() objects


/************************BOX Functions*****************/
//Note: Where is talked of a 'box object', a json object of the form
//{min: new THREE.Vector3(..), max: new THREE.Vector3(..)} is meant.

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
		return [getCorner(bb, 0), getCorner(bb, 1), getCorner(bb, 2), getCorner(bb, 3)];
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
* DOES NOT change the input parameter bb
****************/
function moveTo(bb, p) {
	var diff = new THREE.Vector2(0, 0);
	diff.subVectors(p, getCenter(bb));
	var newMin = new THREE.Vector2(bb.min.x,bb.min.y);
	newMin.add(diff);
	var newMax = new THREE.Vector2(bb.max.x,bb.max.y);
	newMax.add(diff);
	return {min: newMin, max: newMax};
}

/***************
* Returns true if both boxes equal each other
* Eg if their min and max values are the same
* It ignores the z-values (if there are any)
****************/
function equalBoxes(bb1, bb2){
	return (bb1.min.x == bb2.min.x &&
		bb1.min.y == bb2.min.y && bb1.max.x == bb2.max.x &&
		bb1.max.y == bb2.max.y);
}

// /************************Bed Functions*****************/
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
* Return outline of bed (sets it if not yet done)
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
			var c_angle = 2.0 * Math.PI;
			var outline = [];
			bed.radius = bed.xLength / 2.0;
			while (c_angle > 0) {
				var px = bed.radius * Math.sin(c_angle);
				var py = bed.radius * Math.cos(c_angle);
				var p = new THREE.Vector2(px, py);
				outline.push(p);
				c_angle -= 0.2;
			}
			return outline;
		}
	}
}

/***************
* Set outline of bed
* @param: bed, json object
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
}

/***************
* Get margin between boxes
* @param: bed, json object
* Margin is set to 1 by default
****************/
function getMargin(bed) {
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
* Get boxes on bed
* @param: bed, json object
****************/
function getBoxes(bed){
	if (!bed.hasOwnProperty('boxes')) {
		bed.boxes = [];
	}
	return bed.boxes;
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
function removeBox(bed) {
	if (!isEmpty(bed)) {
		bed.boxes.pop();
	}
}

/***************
* Add new box at given position
* @param: bed, json object
* @param: box
* @param: position, Vector2()
****************/
function addBoxAtPosition(bed, bb, position) {
	console.log('Add box', bb, 'at position', position);
	var box = moveTo(bb, position);
	if (isEmpty(bed)) {
		bed.boxes = [box];
	}
	else {
		bed.boxes.push(box);
	}
	return bed;
}

/***************
* Check if box collides with one of the other boxes on the bed
* @param: bed, json object
* @param: box, json object
****************/
function collides(bed, box) {
	if (isEmpty(bed)) {
		return false;
	}

	for (var i = 0; i < bed.boxes.length; i++) {
		//Check if boxes are the same (then outsideHull will return)
		if (equalBoxes(box, bed.boxes[i])) {
			return true;
		}
		if (!outsideHull(box, getHull(bed.boxes[i]))) {
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
	setOutline(bed);
	return (insideHull(box, getOutline(bed)) >= 0);
}

/***************
* Check if box can be placed at the given position on the bed
* @param: bed, json object
* @param: box, json object
* @param: position, Vector2()
****************/
function canPlaceAt(bed, box, position) {
	//Box can be placed at position if it fits on the bed and doesnt collide with any other boxes
	console.log('check if box can be placed at', position);
	var newBox = moveTo(box, position);
	return (isOnBed(bed, newBox) && !collides(bed, newBox));
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
		 console.log('yes', position);
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
		console.log('Add first model to bed');
		if (canPlaceAt(bed, newBox, getBedCenter(bed))) {
			//Place box
			bed = addBoxAtPosition(bed, newBox, getBedCenter(bed));
			return getBedCenter(bed);
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
/***************
* Cross product of three points
* If bigger then 0 then p2 is left of p0->p1, if negative its right of the line
* And in case this returns zero all three points are colinear
****************/
function cross(p0, p1, p2) {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

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
			if (tmp < 0) { //Point is to the right of the current edge, hence not inside hull
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
* @param obj a Vector2() or box json object
* Returns true if completely not inside hull (can touch it)
*/
function outsideHull(obj, hull) {
	var points = [];
	if (obj.hasOwnProperty('min')) {
		points = getCorner(obj, 'all');
	}
	else {
		points.push(obj);
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
	return true;
}
