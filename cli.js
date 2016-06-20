// 'use strict';
//
// const path              = require('path');
// const binPacking        = require('commander');
// const binPackingJson    = require(path.join(__dirname, 'package.json'));
// const lib               = require('./lib');
// const assert            = require('assert');
// const fs                = require('fs');
//
// // set version
// binPacking.version(binPackingJson.version);
//
// // set available commands
// bin-packing
//     .command('addBox [bed] [current_boxes] [new_box]')
//     .description('Update slice profile by filename')
//     .action((bed, current_boxes, new_box) => {
// 		assert(bed);
//         assert(current_boxes);
// 		assert(new_box);
//         lib.addBox(bed,current_boxes,new_box, (err, position) => {
//             console.log("Add new box at position", position);
//         });
//     });
//
// // parse command line arguments
// binPacking.parse(process.argv);
