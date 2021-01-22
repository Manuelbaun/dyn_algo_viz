import type { PanZoom } from "panzoom";
import type { Box, G } from "@svgdotjs/svg.js";

import type AnimationController from "../animation/animation_controller";
import type Interpreter from "../interpreter/interpreter";
import { generateData, get } from "../utils/helper_functions";

import { ElementRefManager, DrawBasic, VisualElement } from "./helper_classes";

/**
 * BIG TODOS:
 *
 * find a way, how the x- and y-position of an element can be inteligentily guessed
 * since just adding
 */

/** The comparisonSort Class */
export default class ComparisonSorts {
  panZoomControl: PanZoom;
  animationControl: AnimationController;
  data: number[];
  elementManager;
  drawing: DrawBasic;

  get colors() {
    return this.colorMapping;
  }

  private colorMapping: {
    get: string;
    push: string;
    swap: string;
    compare: string;
    splice: string;
    shift: string;
    concat: string;
    set: string;
    default: string;
  };

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

    this.elementManager = new ElementRefManager();
    this.drawing = new DrawBasic(rootDraw, viewBox, this.data);

    this.colorMapping = {
      get: this.drawing.colors.Aqua,
      push: this.drawing.colors.Green,
      swap: this.drawing.colors.Red,
      compare: this.drawing.colors.Navy,
      splice: this.drawing.colors.Purple,
      shift: this.drawing.colors.Fuchsia,
      concat: this.drawing.colors.Lime,
      set: this.drawing.colors.Gray,
      default: this.drawing.colors.Silver,
    };
  }

  async setup() {
    const tl = this.animationControl.initTimeline;
    const { scales } = this.drawing;

    // create and add the the refsManager
    this.data.forEach((value) => {
      this.elementManager.setRef(value, new VisualElement(value, this.drawing));
    });

    // position
    this.elementManager.forEachRef((d, i) => {
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
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual elements
    const el1 = ref.getRef(i);
    const el2 = ref.getRef(j);

    // at this point, the js interpreter would have thrown an error
    if (!el1 || !el2) return;

    // get the svg elements to be animated
    const rects = [el1.rectNode, el2.rectNode];

    // Animation Sequence
    await tl
      .add({
        targets: rects,
        fill: this.colorMapping.swap,
        duration: 100,
      })
      .continue();

    await tl
      .add({
        targets: el1.node,
        translateX: el2.posX, // move {groupI} by i
        // translateY: gj.posY,   // swap on Y is not needed, since it is the same Array
        duration: 250,
      })
      .add(
        {
          targets: el2.node,
          translateX: el1.posX, // move {groupJ} by j
          // translateY: gi.posY,
          duration: 250,
        },
        /// By settings this value to -=200 (duration of the previous animation),
        /// this animation starts with the previous animation
        "-=250"
      )
      .continue();

    /// change back the color
    await tl
      .add({
        targets: rects,
        fill: this.colorMapping.default,
        duration: 100,
      })
      .continue();
  }

  async compare(
    array: Interpreter.Object,
    i: number,
    j: number,
    iGreaterJ: boolean
  ) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const el1 = ref.getRef(i);
    const el2 = ref.getRef(j);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!el1 || !el2) return;

    const rects = [el1.rectNode, el2.rectNode];

    // Highligh rects
    tl.add({
      targets: rects,
      fill: this.colorMapping.compare,
      duration: 200,
    });
    await tl.continue();

    // unHighligh rects the first
    if (!iGreaterJ) {
      await tl
        .add({
          targets: rects,
          fill: this.colorMapping.default,
          duration: 100,
        })
        .continue();
    }
  }

  async splice(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);
    const first = ref?.getRef(0);

    if (!first) return;

    const translateY = first.posY + this.drawing.scales.y(1);

    await tl
      .add({
        targets: ref.rectNodes,
        duration: 200,
        fill: this.colorMapping.splice,
      })
      .add({
        targets: ref.groupNodes,
        duration: 200,
        translateY,
      })
      .continue();
  }

  async shift(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    /// needs the last reference position, since value is already gone from [arrClaa]
    const first = ref?.getRef(0);
    if (!first) return;

    const translateX = first.posX;

    // move all elements to the left by 1 position, that are in that array
    ref.forEachRef((d, i) => {
      tl.add({
        targets: d.node,
        duration: 100,
        translateX: translateX + this.drawing.scales.x(i - 1),
      });
    });

    // shift, first element to the left
    tl.add({
      targets: first.node,
      duration: 50,
      opacity: 0,
      translateX: translateX - this.drawing.scales.x(1),
    }).add(
      {
        targets: first.rectNode,
        fill: this.colorMapping.shift,
        duration: 50,
      },
      "-=50"
    );

    return tl.continue();
  }

  async push(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const isNewArray = this.elementManager.has(array);
    const ref = this.elementManager.getArrayWrapper(array);

    // get last element! since the value is already added by the interpreter!
    const group = ref.getRef(ref.length - 1);
    const first = ref.getRef(0);

    if (!group || !first) return;

    const translateX = first?.posX + this.drawing.scales.x(ref.length);

    let translateY = first.posY;
    if (isNewArray) {
      // const pos = this.refsManager.getAllYPos();
      // Math.max(...pos) +
      translateY = this.drawing.scales.y(1);
    }

    await tl
      .add({
        targets: group.node,
        duration: 200,
        translateX,
        translateY,
        opacity: 1,
      })
      .add(
        {
          targets: group.rectNode,
          duration: 200,
          fill: this.colorMapping.push,
        },
        "-=100"
      )
      .continue();
  }

  async concat(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.elementManager.getArrayWrapper(array);
    const firstElement = ref?.getRef(0);
    if (!firstElement) return;

    // get position of current array
    let translateY = firstElement.posY;

    if (translateY == undefined || 0) {
      translateY = this.drawing.scales.y(1);
    }

    const translateX = firstElement.posX;

    await tl
      .add({
        targets: ref.rectNodes,
        duration: 200,
        fill: this.colorMapping.concat,
      })
      .continue();

    ref.groupNodes.forEach(async (e, i) => {
      tl.add({
        targets: e,
        duration: 100,
        translateX: translateX + this.drawing.scales.x(i),
        translateY,
      });
    });

    return await tl.continue();
  }

  async set(array: Interpreter.Object, i: number, value: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const group = ref.getByValue(value);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!group) return;

    // Highligh rects
    await tl
      .add({
        targets: group.rectNode,
        fill: this.colorMapping.set,
        duration: 200,
      })
      .add({
        targets: group.node,
        translateX: this.drawing.scales.x(i),
        translateY: 0,
        duration: 200,
      })
      .continue();
  }

  async get(array: Interpreter.Object, i: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const group = ref.getRef(i);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!group) return;

    // Highligh rects
    await tl
      .add({
        targets: group.rectNode,
        fill: this.colorMapping.get,
        duration: 200,
      })
      .add({
        targets: group.node,
        translateY: this.drawing.scales.y(1),
        duration: 200,
      })
      .continue();
    // Dont know, why the animation would not animate properly,
    // when this animation is changed with the following one => leave as is

    tl.add({
      targets: group.rectNode,
      fill: this.colorMapping.default,
      duration: 200,
    });

    return await tl.continue();
  }
}
