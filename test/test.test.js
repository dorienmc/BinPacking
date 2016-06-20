'use strict';

const assert  				= require('assert');
const utils					= require('../lib/utils.js');
const Bed					= require('../lib/utils.js').Bed;
const Box					= require('../lib/utils.js').Box;
const Point					= require('../lib/utils.js').Point;
const stringify				= utils.stringify;

describe('Point class', () => {
	describe('Constructor', () => {
		it('should default to (0,0)', () => {
			var p = new Point();
			assert.equal(p.x, 0);
			assert.equal(p.y, 0);
		});
		it('Point(3.14,6.7) should have x = 3.14 and y = 6.7', () => {
			var p = new Point(3.14, 6.7);
			assert.equal(p.x, 3.14);
			assert.equal(p.y, 6.7);
		});
	});
	describe('Operations', () => {
		it('(2,1)+(3,2)==(5,3)', () => {
			var p0 = new Point(2, 1);
			var p1 = new Point(3, 2);
			var p2 = new Point(5, 3);
			assert(p2.equals(utils.addPoint(p0, p1)));
		});
		it('(5,1) - (6,0) == (-1,1)', () => {
			var p0 = new Point(5, 1);
			var p1 = new Point(6, 0);
			var p2 = new Point(-1, 1);
			assert(p2.equals(utils.substractPoint(p0, p1)));
		});
		it('Distance between (3,4) and (0,0) equals 5', () => {
			var p0 = new Point();
			var p1 = new Point(3, 4);
			assert.equal(p0.distance(p1), 5);
		});
	});
	describe('Other', () => {
		it('Point(3.14,6.7) is written down as \'(3.14, 6.7)\'', () => {
			var p = new Point(3.14, 6.7);
			assert.equal(stringify(p), '(3.14, 6.7)');
		});
	});

});

describe('Box class', () => {
	describe('Constructor', () => {
		var b = new Box(5, 10);
		it('Box(5,10) should create a box of width 5 and height 10', () => {
			assert.equal(b.width, 5);
			assert.equal(b.height, 10);
		});
		it('Box(5,10) should have its center at the origin', () => {
			var origin = new Point();
			assert(b.getCenter().equals(origin));
		});
		it('Box(5,10) should have its corners at (-2.5,5), (2.5,5), (2.5,-5) and (-2.5,-5)', () => {
			var corners = [new Point(-2.5, 5), new Point(2.5, 5), new Point(2.5, -5), new Point(-2.5, -5)];
			assert(b.getCorner(0).equals(corners[0]));
			assert(b.getCorner(1).equals(corners[1]));
			assert(b.getCorner(2).equals(corners[2]));
			assert(b.getCorner(3).equals(corners[3]));
		});
	});
	describe('Other', () => {
		it('Moving a box by (width/2,height/2) should give a box with its min point at (0,0) and max at (width,height)', () => {
			var width = 5, height = 10;
			var origin = new Point(), maxPoint = new Point(width, height);
			var b = new Box(width, height);
			b.moveToXY(width / 2.0, height / 2.0);
			assert(b.min.equals(origin));
			assert(b.max.equals(maxPoint));
		});
		it('Box(5,10) is stringified to (-2.5, -5) by (2.5, 5)', () => {
			var b = new Box(5, 10);
			assert.equal(b.stringify(), '(-2.5, -5) by (2.5, 5)');
		});
		//TODO: Convert Box2 to Box
	});
});

describe('Convex hull algorithm', () => {
	it('Convex hull around Box(5,10) should equal its corners (in ccw order starting at minpoint)', () => {
		var boxes = [new Box(5, 10)];
		var convhull = utils.convexHullBox(boxes);
		var boxh = boxes[0].getHull();
		assert(convhull[0].equals(boxh[0]));
		assert(convhull[1].equals(boxh[1]));
		assert(convhull[2].equals(boxh[2]));
		assert(convhull[3].equals(boxh[3]));
	});
	describe('Convex hull around two boxes of 5 by 10, one centered at (-2.5,5) the other at (2.5,5)', () => {
		var boxes = [new Box(5, 10, 2.5, 5), new Box(5, 10, -2.5, 5)];
		var convhull = utils.convexHullBox(boxes);
		it('should have 4 points', () => {
			assert.equal(convhull.length, 4);
		});
		it('which should equal (-5, 0), (5, 0), (5, 10), (-5, 10)', () => {
			assert.equal(stringify(convhull[0]), '(-5, 0)');
			assert.equal(stringify(convhull[1]), '(5, 0)');
			assert.equal(stringify(convhull[2]), '(5, 10)');
			assert.equal(stringify(convhull[3]), '(-5, 10)');
		});
	});
	describe('Adding a box of 5 by 10 at (2.5,15) the boxes at (-2.5,5) the other at (2.5,5) gives', () => {
		var boxes = [new Box(5, 10, 2.5, 5), new Box(5, 10, -2.5, 5), new Box(5, 10, 2.5, 15)];
		var convhull = utils.convexHullBox(boxes);
		it('should have 5 points', () => {
			assert.equal(convhull.length, 5);
		});
		it('and should equal (-5, 0), (5, 0), (5, 20), (0, 20), (-5, 10)', () => {
			assert.equal(stringify(convhull[0]), '(-5, 0)');
			assert.equal(stringify(convhull[1]), '(5, 0)');
			assert.equal(stringify(convhull[2]), '(5, 20)');
			assert.equal(stringify(convhull[3]), '(0, 20)');
			assert.equal(stringify(convhull[4]), '(-5, 10)');
		});
	});
	describe('Testing if boxes are in the convex hull', () => {
		var boxes = [new Box(5, 10)];
		var otherbox = new Box(5, 10, 2.5, 0);
		var convhull = utils.convexHullBox(boxes);
		it('Box(5,10) should be on the hull around this box', () => {
			assert.equal(utils.insideHull(boxes[0], convhull), 0);
		});
		it('Box(5,10) centered at (2.5,0) is not, completely, inside this hull', () => {
			assert.equal(utils.insideHull(otherbox, convhull), -1);
		});
		it('The corners (0,-5) and (0,5) are on the hull', () => {
			assert.equal(utils.insideHull(otherbox.getCorner('dl'), convhull), 0);
			assert.equal(utils.insideHull(otherbox.getCorner('tl'), convhull), 0);
		});
		it('The corners (5,-5) and (5,5) are outside the hull', () => {
			assert.equal(utils.insideHull(otherbox.getCorner('dr'), convhull), -1);
			assert.equal(utils.insideHull(otherbox.getCorner('tr'), convhull), -1);
		});
		it('The origin is inside the hull', () => {
			var origin = new Point();
			assert.equal(utils.insideHull(origin, convhull), 1);
		});
	});
});

describe('Bed class', () => {
	describe('Constructor', () => {
		it('A bed starts empty', () => {
			var bed = new Bed('corner', 'rectangular', 100, 120);
			assert(bed.isEmpty());
		});
		describe('Rectangular bed', () => {
			var bed = new Bed('corner', 'rectangular', 100, 120);
			var bed2 = new Bed('center', 'rectangular', 100, 120);
			var outline = bed.getOutline();
			it('With origin in \'corner\', has center at (50, 60)', () => {
				assert.equal(stringify(bed.getCenter()), '(50, 60)');
			});
			it('With size 100 x 120 has width 100 and height 120', () => {
				assert.equal(bed.width, 100);
				assert.equal(bed.height, 120);
			});
			it('And has outline (0,0) -> (100,0) -> (100,120) -> (0,120)', () => {
				assert.equal(stringify(outline[0]), '(0, 0)');
				assert.equal(stringify(outline[1]), '(100, 0)');
				assert.equal(stringify(outline[2]), '(100, 120)');
				assert.equal(stringify(outline[3]), '(0, 120)');
			});
			it('The same bed with origin at the center, has center at (0, 0)', () => {
				assert.equal(stringify(bed2.getCenter()), '(0, 0)');
			});
			it('And outline (-50,-60) -> (50, -60) -> (50, 60) -> (-50, 60)', () => {
				var outline2 = bed2.getOutline();
				assert.equal(stringify(outline2[0]), '(-50, -60)');
				assert.equal(stringify(outline2[1]), '(50, -60)');
				assert.equal(stringify(outline2[2]), '(50, 60)');
				assert.equal(stringify(outline2[3]), '(-50, 60)');
			});
		});
		describe('Round bed', () => {
			var bed = new Bed('corner', 'round', 100, 120);
			it('With shape set to corner, still has center at origin', () => {
				assert.equal(stringify(bed.getCenter()), '(0, 0)');
			});
			it('With width = 100, height = 200 has a radius of 100/2 (height is ignored)', () => {
				assert.equal(bed.radius, 50);
			});
			it('And has an outline that approximates a circle around (0,0) with radius 50', () => {
				var outline = bed.getOutline();
				for (var i = 0; i < outline.lenght; i++) {
					assert.equal(outline[i].x, 50 * Math.sin(i * 0.2));
					assert.equal(outline[i].y, 50 * Math.cos(i * 0.2));
				}
			});
		});

	});
});

describe('Adding boxes to bed', () => {
	describe('Adding the first box', () => {
		var bed = new Bed('corner', 'rectangular', 100, 120);
		var boxes = [new Box(5, 10), new Box(100, 120), new Box(120, 120)];
		it('is possible if the box is smaller than the bed', () => {
			assert(bed.addBox(boxes[0]) != undefined);
			bed.removeBox();
		});
		it('is possible if the box is the same size as the bed', () => {
			assert(bed.addBox(boxes[1]) != undefined);
			bed.removeBox();
		});
		it('is not possible if the box is bigger than the bed', () => {
			assert(bed.addBox(boxes[2]) == undefined);
		});
	});

	describe('Adding multiple boxes', () => {
		var bed2 = new Bed('corner', 'rectangular', 9, 9);
		var position2 = [];
		for (var i = 0; i < 9; i++) {
			var box = new Box(2, 2);
			position2.push(bed2.addBox(box));
		}
		var exp2_posX = [4.5, 4.5, 1.5, 1.5, 1.5, 4.5, 7.5, 7.5, 7.5];
		var exp2_posY = [4.5, 7.5, 7.5, 4.5, 1.5, 1.5, 1.5, 4.5, 7.5];

		describe('A bed of 9 x 9', () => {
			it('Fits 9 boxes of 2 x 2 (margin = 1)', () => {
				assert.equal(bed2.getBoxes().length, 9);
			});
			describe('which are put in a spiral', () => {
				for (var i = 0; i < 9; i++) {
					(function(i) {
						var msg = `Box ${i} is placed at (${exp2_posX[i]}, ${exp2_posY[i]})`;
						it(msg, () => {
							 assert.equal(position2[i].x, exp2_posX[i]);
							 assert.equal(position2[i].y, exp2_posY[i]);
						});
					})(i);
				}
			});
		});


		describe('A round bed of diameter 12', () => {
			var bed = new Bed('center', 'round', 12);
			var position = [];
			for (var i = 0; i < 9; i++) {
				var box = new Box(2, 2);
				position.push(bed.addBox(box));
			}
			var exp_posX = [0, 0, -3, -3, -3, 0, 3, 3, 3];
			var exp_posY = [0, 3, 3, 0, -3, -3, -3, 0, 3];

			it('Also fits 9 boxes of 2 x 2 (margin = 1)', () => {
				assert.equal(bed.getBoxes().length, 9);
			});
			describe('which are put in a spiral', () => {
				for (var i = 0; i < 9; i++) {
					(function(i) {
						var msg = `Box ${i} is placed at (${exp_posX[i]}, ${exp_posY[i]})`;
						it(msg, () => {
							 assert.equal(position[i].x, exp_posX[i]);
							 assert.equal(position[i].y, exp_posY[i]);
						});
					})(i);
				}
			});
		});

		describe('And a round bed of diameter 11', () => {
			var bed3 = new Bed('center', 'round', 11);
			var position3 = [];
			for (var i = 0; i < 9; i++) {
				var box = new Box(2, 2);
				position3.push(bed3.addBox(box));
			}
			it('cannot fit these 9 boxes of 2x2', () => {
				assert(bed3.getBoxes().length != 9);
			});
		});


	});

});

//TODO
describe('AddBox() function', () => {});
describe('AddBoxes() function', () => {});
//TEMPLATE FOR LOOPING OVER IT() STATEMENTS
// for (var i = 0; i < something.length; i++) {
//   (function(i) {
//      //it() functions here
//   })(i);
// }
