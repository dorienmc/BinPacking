//File for functions related to adding now boxes to the bed
'use strict';
const assert				= require(assert);
const Bed					= require('../lib/utils.js').Bed;
const Box2ToBox				= require('../lib/utils.js').Box2ToBox;


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

/**
 * Add multiple new models to bed
 * @param new_models: array of THREE.Box2() objects representing the 2D bounding boxes around the new models
 * @param current_models: array of THREE.Box2() objects representing the models already on the bed
 * @param bedOrigin: position of the bed origin either 'corner' or 'center'
 * @param bedsize1: xLength of a rectangular bed or diameter of a round bed
 * @param bedsize2: yLength of a rectangular bed or undefined in case of a round bed
 */
function addBoxes(new_models, current_models, bedOrigin, bedsize1, bedsize2) {
	assert(new_models, 'New models not found');
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

	//Find position for new boxes
	var positions = [];
	for (var j = 0; j < new_models.length; j++) {
		var newBox = Box2ToBox(new_models[j]);
		var position = bed.addBox(newBox);

		//Add position, if there is one
		if (position != undefined) {
			positions.push([position.x, position.y]);
		}
		else {
			positions.push(undefined);
		}
		//return new THREE.Vector2(position.x,position.y);
	}

	return positions;
}


module.exports = {
	addBox,
	addBoxes
};
