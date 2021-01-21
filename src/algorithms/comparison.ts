import type { PanZoom } from "panzoom";
import type { Box, G } from "@svgdotjs/svg.js";

import type AnimationController from "../animation/animation_controller";
import type Interpreter from "../interpreter/interpreter";
import { generateData } from "../utils/helper_functions";

import {
  ArrayRef,
  ArrayRefManager,
  DrawBasic,
  GroupRef,
} from "./helper_classes";

/**
 * Type declarations
 */

/** The comparisonSort Class */
export default class ComparisonSorts {
  panZoomControl: PanZoom;
  animationControl: AnimationController;

  data: number[];
  refsManager;

  drawer: DrawBasic;

  // TODO: proper type fo svgjs, since it is not just svgjs!!
  constructor(
    rootDraw: G,
    viewBox: Box,
    animationControl: AnimationController,
    panZoomer: PanZoom,
    zoomFit: Function,
    length = 10
  ) {
    this.data = generateData(length);
    this.panZoomControl = panZoomer;
    this.animationControl = animationControl;

    this.refsManager = new ArrayRefManager(rootDraw);
    this.drawer = new DrawBasic(rootDraw, viewBox, this.data);
  }

  async setup() {
    const tl = this.animationControl.initTimeline;
    const { scales } = this.drawer;

    // create and add the the refsManager
    this.data.forEach((value) => {
      const g = new GroupRef({ value, draw: this.drawer });
      this.refsManager.setRef(value, g);
    });

    // position
    this.refsManager.forEachRef((d, i) => {
      tl.add({
        targets: d.node,
        duration: 200,
        translateX: scales.x(i),
        opacity: 1,
      });
    });

    /// wait till timeline animation is done
    return await tl.continue();
  }

  async swap(array: Interpreter.Object, i: number, j: number) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.refsManager.getArrayRef(array);

    // get visual objects
    const gi = ref.getRef(i);
    const gj = ref.getRef(j);

    // at this point, the js interpreter would have thrown an error
    if (!gi || !gj) return;

    // get the svg elements to be animated
    const rects = [gi.rectNode, gj.rectNode];

    // Animation Sequence
    tl.add({
      targets: rects,
      fill: this.drawer.colors.highlight,
      duration: 100,
    });

    await tl.continue();

    tl.add({
      targets: gi.node,
      translateX: gj.posX, // move {groupI} by i
      duration: 250,
    }).add(
      {
        targets: gj.node,
        translateX: gi.posX, // move {groupJ} by j
        duration: 250,
      },
      /// By settings this value to -=200 (duration of the previous animation),
      /// this animation starts with the previous animation
      "-=200"
    );

    await tl.continue();

    /// change back the color
    tl.add({
      targets: rects,
      fill: this.drawer.colors.base,
      duration: 100,
    });

    // dont forget to call continue, since the animation of algotimeline
    // wont start automatically. This was disabled, in the controller
    return await tl.continue();
  }

  async compare(
    array: Interpreter.Object,
    i: number,
    j: number,
    iGreaterJ: boolean
  ) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.refsManager.getArrayRef(array);

    // get visual objects
    const rv = ref.getRef(i);
    const rw = ref.getRef(j);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!rv || !rw) return;

    const rects = [rv.rectNode, rw.rectNode];

    // Highligh rects
    tl.add({
      targets: rects,
      fill: this.drawer.colors.check,
      duration: 200,
    });
    await tl.continue();

    // unHighligh rects
    if (!iGreaterJ) {
      tl.add({
        targets: rects,
        fill: this.drawer.colors.base,
        duration: 100,
      });
    }

    // dont forget to call continue, since the animation of algotimeline
    // wont start automatically. This was disabled, in the controller
    return await tl.continue();
  }

  async splice(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.refsManager.getArrayRef(array);

    if (ref.translateX == undefined) {
      return;
    }

    const translateY = ref.translateY + this.drawer.scales.y(1);

    tl.add({
      targets: ref.rectNodes,
      duration: 200,
      fill: this.drawer.colors.highlight,
    }).add({
      targets: ref.groupNodes,
      duration: 200,
      translateY,
    });

    return await tl.continue();
  }

  async shift(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.refsManager.getArrayRef(array);

    /// needs the last reference position, since value is already gone from [arrClaa]
    const group = ref.getRef(0);
    if (!group) return;

    const translateX = group.matrix.translateX;

    // move all elements to the left by 1 position, that are in that array
    ref.forEachRef((d, i) => {
      tl.add({
        targets: d.node,
        duration: 100,
        translateX: translateX + this.drawer.scales.x(i - 1),
      });
    });

    // shift, first element to the left
    tl.add({
      targets: group.node,
      duration: 50,
      opacity: 0,
      translateX: translateX - this.drawer.scales.x(1),
    }).add(
      {
        targets: group.rectNode,
        fill: this.drawer.colors.pop,
        duration: 50,
      },
      "-=50"
    );

    return tl.continue();
  }

  async push(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const isNewArray = this.refsManager.has(array);
    const ref = this.refsManager.getArrayRef(array);
    // get last element!
    const group = ref.getRef(ref.length - 1);
    if (!group) return;

    const matrix = ref.matrix;
    const translateX = matrix.translateX + this.drawer.scales.x(ref.length);

    let translateY;
    if (isNewArray) {
      translateY =
        Math.max(...this.refsManager.getAllYPos()) + this.drawer.scales.y(1);
    } else {
      translateY = matrix.translateY;
    }

    tl.add({
      targets: group.node,
      duration: 200,
      delay: 0,
      translateX,
      translateY,
      opacity: 1,
    }).add(
      {
        targets: group.rectNode,
        duration: 200,
        fill: this.drawer.colors.push,
      },
      "-=100"
    );

    return tl.continue();
  }

  async concat(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.refsManager.getArrayRef(array);
    const matrix = ref.matrix;

    // get position of current array
    let translateY = ref.translateY;

    if (translateY == undefined || 0) {
      translateY = this.drawer.scales.y(1);
    } else {
      translateY = matrix.translateY;
      // const translateY = matrix.translateY + this.scales.y(1);
    }

    const translateX = matrix.translateX;

    tl.add({
      targets: ref.rectNodes,
      duration: 200,
      fill: this.drawer.colors.pop,
    }).add({
      targets: ref.groupNodes,
      duration: 200,
      translateY,
    });

    ref.groupNodes.forEach(async (e, i) => {
      tl.add({
        targets: e,
        duration: 100,
        translateX: translateX + this.drawer.scales.x(i),
        translateY,
      });
    });

    return await tl.continue();
  }

  /**
   * clones visually the elements, and then should remove them???
   * but when removing the elements, it will remove them completly and
   * no animation is play able
   * @param elements
   * @param opacity
   */
  async cloneElements(arrClaa: ArrayRef, opacity = 0.5) {
    const clones = arrClaa.mapRef((el) => el);

    const tl = this.animationControl.algoTimeline;

    const clonedElements = clones.map((e) => {
      const clone = e.root.clone();
      clone.attr("opacity", 0);
      return clone;
    });

    const parent = clones[0].root.parent() as G;
    const cloneGrouP = parent.group();
    cloneGrouP.attr("id", "clones-" + arrClaa.id);
    clonedElements.forEach((d, i) => cloneGrouP.add(d));

    tl.add({
      targets: clonedElements.map((e) => e.node),
      duration: 200,
      opacity: 0.2,
    });

    await tl.continue();
    return clonedElements;
  }
}

// createInterpreterInitFunction() {
//   const algorithm = this;
//   type IntObject = Interpreter.Object;
//   const interpreterInitFunctions = function (
//     interpreter: Interpreter,
//     globalObject: Interpreter.Object
//   ) {
//     // func must be no anynomus functions => `this` needs references the pseudo array
//     type PseudoArrayMethod = (
//       this: Interpreter.Object,
//       ...args: any[]
//     ) => any;

//     const registerPrototype = (name: string, func: PseudoArrayMethod) => {
//       interpreter.setNativeFunctionPrototype(
//         interpreter.ARRAY as Interpreter.Object,
//         name,
//         func
//       );
//     };

//     /** **************** */
//     /** Define Props     */
//     /** **************** */

//     const root = interpreter.nativeToPseudo(algorithm.data);
//     interpreter.setProperty(globalObject, "root", root);

//     /**
//      * Global function "PRint"
//      */
//     interpreter.setProperty(
//       globalObject,
//       "print",
//       interpreter.createNativeFunction(function (...obj: any[]) {
//         const node = interpreter.stateStack.getTop().node;
//         const printLine = "print:" + node.loc.start.line;
//         try {
//           if (obj instanceof Array) {
//             const res = obj.map((e) => interpreter.pseudoToNative(e));

//             console.log(printLine, ...res);
//           } else {
//             const res = interpreter.pseudoToNative(obj);
//             console.log(printLine, res);
//           }
//         } catch (e) {
//           console.log(e);
//           console.log(printLine, obj);
//         }
//       }, false)
//     );

//     /** **************** */
//     /** Define functions */
//     /** **************** */

//     /// extends the array prototype of the interpreter! with a compare function
//     registerPrototype("compare", function (i: number, j: number) {
//       const node = interpreter.stateStack.getTop().node;
//       // editorController.markNode(node, "#aaafff");

//       // do animation
//       const arr = this.properties;
//       const res = arr[i] > arr[j];

//       if (res == null) {
//         interpreter.throwException(
//           interpreter.RANGE_ERROR,
//           `Cannot compare elements, since either element at index i:${i}=>${arr[i]} OR j:${j}=>${arr[j]} does not exist on this array`
//         );
//       }

//       // do animation
//       interpreter.asyncCall(() => algorithm.compare(this, i, j, res));

//       return res;
//     });

//     registerPrototype("swap", function (i, j) {
//       const node = interpreter.stateStack.getTop().node;
//       // editorController.markNode(node, "#cccccc");

//       /// swap the data
//       const arr = this.properties;

//       // get real values;
//       const a = arr[i];
//       const b = arr[j];

//       if (!a || !b) {
//         interpreter.throwException(
//           interpreter.RANGE_ERROR,
//           `Cannot swap elements, since either element at index i:${i}=>${a} OR j:${j}=>${b} does not exist on this array`
//         );
//       }
//       arr[i] = b;
//       arr[j] = a;

//       // do animation by real values
//       interpreter.asyncCall(() => algorithm.swap(this, i, j));
//     });

//     registerPrototype("splice", function (start, end) {
//       // editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

//       const data = Array.prototype.splice.call(this.properties, start, end);
//       const newObj = interpreter.arrayNativeToPseudo(data);

//       interpreter.asyncCall(() => algorithm.splice(newObj));
//       return newObj;
//     });

//     registerPrototype("shift", function (...args) {
//       // editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

//       interpreter.asyncCall(() => algorithm.shift(this));
//       return Array.prototype.shift.call(this.properties);
//     });

//     registerPrototype("push", function (...args) {
//       // editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

//       const res = Array.prototype.push.apply(this.properties, args);

//       interpreter.asyncCall(() => algorithm.push(this));
//       return res;
//     });

//     registerPrototype("get", function (index) {
//       // editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

//       const element = this.properties[index];
//       return element;
//     });

//     registerPrototype("set", function (index, element) {
//       // editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");
//       this.properties[index] = element;
//     });

//     // copied from the interpreterclass
//     const concat = function (thisArray: Interpreter.Object, ...args: any[]) {
//       var data = [];
//       var length = 0;
//       // Start by copying the current array.
//       var iLength = interpreter.getProperty(thisArray, "length") as number;
//       for (var i = 0; i < iLength; i++) {
//         if (interpreter.hasProperty(thisArray, i)) {
//           var element = interpreter.getProperty(thisArray, i);
//           data[length] = element;
//         }
//         length++;
//       }
//       // Loop through all args and copy them in.
//       for (var i = 0; i < args.length; i++) {
//         var value = args[i];
//         if (interpreter.isa(value, interpreter.ARRAY)) {
//           var jLength = interpreter.getProperty(value, "length") as number;
//           for (var j = 0; j < jLength; j++) {
//             if (interpreter.hasProperty(value, j)) {
//               data[length] = interpreter.getProperty(value, j);
//             }
//             length++;
//           }
//         } else {
//           data[length] = value;
//         }
//       }
//       return data;
//     };

//     registerPrototype("concat", function (...args: []) {
//       // editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

//       const data = concat(this, arguments);
//       const newArray = interpreter.arrayNativeToPseudo(data);

//       interpreter.asyncCall(() => algorithm.concat(newArray));
//       return newArray;
//     });
//   };

//   return interpreterInitFunctions;
// }
