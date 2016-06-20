# BinPacking
Bundled scripts to pack rectangular shapes in a restricted 2D space

## Tests
<!---
##[![Build Status](https://travis-ci.org/dorienmc/bin-packing.svg?branch=master)](https://travis-ci.org/dorienmc/BinPacking)
-->

To run the tests, simply run `npm test` after you have done `npm install`. This makes sure you pull all the development
dependencies like `mocha` and then run the tests (which are located in `/test`).

## CLI Usage
TODO

<!---
You can run some functions in the CLI to test them. To install this tool as global NPM package from GitHub, run the following command:

```
npm install -g dorienmc/bin-packing
```

After that, you can run the commands beneath.

### addBox
Add given box on the given bed which already has the given current boxes.

```
bin-packing addBox [bed] [current_boxes] [new_box]
```

**Arguments:**
* The first argument is bed the box should be put on
* The second argument is an array of the boxes already on the bed
* The third argument is the new box that should be added.

**Example**
Adding a box (50 by 100) on an empty rectangular bed (100 by 100)

```
var new_box = Box(50,100);
var bed = Box(100,100);
bin-packing addBox bed [] new_box;
```

### help
Get info about the CLI functions.

```
bin-packing --help
```
-->
