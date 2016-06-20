//Contains algorithm to get convex hull and functions needed for that
'use strict';

const utils					= require('./utils.js');
const Box					= require('./utils.js').Box;
const Point					= require('./utils.js').Point;

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

 module.exports = {
	 convexHull,
	 convexHullBox,
	 insideHull
 };
