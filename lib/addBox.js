//File for functions related to adding now boxes to the bed
//TODO 1.Create bed, create outline around given boxes, add new box (try different rules)
'use strict';
const assert				= require(assert);
const Box					= require('../lib/utils.js').Box;
const Point					= require('../lib/utils.js').Point;
const Box2ToBox				= require('../lib/utils.js').Box2ToBox;
const hull					= require('../lib/hull.js');

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
		return (hull.insideHull(box, this.outline) >= 0);
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
		if (this.boxes.length == 0)
			return false;

		for (var i = 0; i < this.boxes.length; i++) {
			if (hull.insideHull(box, this.boxes[i].getHull()) >= 0) {
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

/**
 * Add new model to bed
 * @param new_model: THREE.Box2() object representing the 2D bounding box around the new model
 * @param current_models: array of THREE.Box2() objects representing the models already on the bed
 * @param bedOrigin: position of the bed origin either 'corner' or 'center'
 * @param bedsize1: xLength of a rectangular bed or diameter of a round bed
 * @param bedsize2: yLength of a rectangular bed or undefined in case of a round bed
 */
function addBox(new_model, current_models, bedOrigin, bedsize1, bedsize2) {
	assert(new_model, 'New model not found');
	assert((bedOrigin == 'corner' || bedOrigin == 'center'), 'Bed origin should be either \'corner\' or \'center\'');
	assert(bedsize1, 'Bedsize1 not found');
	if (current_models == undefined)
		current_models = [];

	//Create bed
	var bed = (bedsize2 == undefined ? new Bed(bedOrigin, 'round', bedsize1) : new Bed(bedOrigin, 'rectangular', bedsize1, bedsize2));

	//Place current models
	for (var i = 0; i < current_models.length; i++) {
		var box = Box2ToBox(current_models[i]);
		bed.addBoxAtPosition(box, box.getCenter());
	}

	//Find position for new box
	var newBox = Box2ToBox(new_model);
	var position = bed.addBox(newBox);

	//Return position, if there is one
	if (position != undefined) {
		return [position.x, position.y];
	}
	else {
		return undefined;
	}
	//return new THREE.Vector2(position.x,position.y);
}


module.exports = {
	Bed,
	addBox
};
