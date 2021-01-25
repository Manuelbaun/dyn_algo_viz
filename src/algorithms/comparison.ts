import type { PanZoom } from "panzoom";
import type { Box, G } from "@svgdotjs/svg.js";

import type AnimationController from "../animation/animation_controller";
import type Interpreter from "../interpreter/interpreter";
import { generateData } from "../utils/helper_functions";

import { ElementManager, DrawBasic, VisualElement } from "./helper_classes";

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
    length = 10
  ) {
    this.data = generateData(length);
    // this.data = Array(50)
    // .fill(0)
    // .map((a, i) => i);

    this.panZoomControl = panZoomer;
    this.animationControl = animationControl;

    this.drawing = new DrawBasic(rootDraw, viewBox, this.data);
    this.elementManager = new ElementManager(this.drawing);

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
    // create and add the the refsManager
    this.data.forEach((value) => {
      this.elementManager.setRef(value, new VisualElement(value, this.drawing));
    });
  }

  /** * must await setup! */
  setup() {
    const tl = this.animationControl.initTimeline;
    const { scales } = this.drawing;

    // position
    this.elementManager.forEachRef((d, i) => {
      tl.add({
        targets: d.node,
        duration: 50,
        translateX: scales.x(i),
        opacity: 1,
      });
    });

    if (this.animationControl.getSpeed() == 0) {
      console.error("Speed of animation is 0, there nothing will happen");
    }
    /// wait till timeline animation is done
    return tl.continue();
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
        duration: 200,
      })
      .continue();

    await tl
      .add({
        targets: el1.node,
        translateX: el2.posX, // move {groupI} by i
        duration: 400,
      })
      .add(
        {
          targets: el2.node,
          translateX: el1.posX, // move {groupJ} by j
          duration: 400,
        },
        /// By settings this value to -=400 (duration of the previous animation),
        /// this animation starts with the previous animation
        "-=400"
      )
      .continue();

    /// change back the color
    await tl
      .add({
        targets: rects,
        fill: this.colorMapping.default,
        duration: 200,
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
          duration: 200,
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

    tl.add({
      targets: ref.rectNodes,
      duration: 200,
      fill: this.colorMapping.splice,
    }).add({
      targets: ref.groupNodes,
      duration: 800,
      translateY,
    });

    await tl.continue();
  }

  async shift(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    const first = ref?.getRef(0);
    if (!first) return;

    const translateX = first.posX;

    // move all elements to the left by 1 position, that are in that array
    tl.add({
      targets: first.rectNode,
      fill: this.colorMapping.shift,
      duration: 200,
    }).add({
      targets: first.node,
      duration: 500,
      opacity: 0,
      translateX: translateX + this.drawing.scales.x(-1),
    });

    ref.forEachRef((d, i) => {
      if (d != first) {
        tl.add(
          {
            targets: d.node,
            duration: 400,
            translateX: translateX + this.drawing.scales.x(i - 1),
          },
          "-=400"
        );
      }
    });

    return tl.continue();
  }

  async push(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.elementManager.getArrayWrapper(array);

    // get last element! since the value is already added by the interpreter!
    const group = ref.getRef(ref.length - 1);
    const first = ref.getRef(0);

    if (!group || !first) return;

    const newArray = ref.length == 1;

    const xy = this.elementManager.findFree(first, newArray);

    const translateY = newArray
      ? this.drawing.scales.y(xy.y)
      : this.drawing.scales.y(first.y);

    const translateX = newArray
      ? this.drawing.scales.x(xy.x)
      : first.posX + this.drawing.scales.x(ref.length - 1);

    tl.add({
      targets: group.node,
      duration: 400,
      translateX,
      translateY,
    })
      .add(
        {
          targets: group.rectNode,
          duration: 200,
          fill: this.colorMapping.push,
        },
        "-=200"
      )
      .add(
        {
          targets: group.node,
          duration: 200,
          opacity: 1,
        },
        "-=200"
      );

    await tl.continue();
  }

  async concat(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.elementManager.getArrayWrapper(array);
    const first = ref?.getRef(0);
    if (!first) return;

    const translateX = first.posX;
    const translateY = first.posY;

    tl.add({
      targets: ref.rectNodes,
      duration: 200,
      fill: this.colorMapping.concat,
    });

    ref.forEachRef((e, i) => {
      tl.add(
        {
          targets: e.node,
          duration: 500,
          translateX: translateX + this.drawing.scales.x(i),
          translateY,
        },
        "-=200"
      );
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
    tl.add({
      targets: group.rectNode,
      fill: this.colorMapping.set,
      duration: 100,
    }).add({
      targets: group.node,
      translateX: this.drawing.scales.x(i),
      translateY: group.posY - this.drawing.scales.y(1),
      duration: 200,
    });

    await tl.continue();
  }

  async get(array: Interpreter.Object, i: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const group = ref.getRef(i);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!group) return;

    // Highligh rects
    tl.add({
      targets: group.rectNode,
      fill: this.colorMapping.get,
      duration: 100,
    }).add({
      targets: group.node,
      translateY: group.posY + this.drawing.scales.y(1),
      duration: 200,
    });

    await tl.continue();
    // Dont know, why the animation would not animate properly,
    // when this animation is changed with the following one => leave as is

    tl.add({
      targets: group.rectNode,
      fill: this.colorMapping.default,
      duration: 100,
    });

    return await tl.continue();
  }
}
