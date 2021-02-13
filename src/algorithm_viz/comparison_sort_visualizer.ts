import type { G } from "@svgdotjs/svg.js";
import type AnimationController from "../animation/animation_controller";
import type Interpreter from "../interpreter/interpreter";
import { generateData } from "../utils/helper_functions";
import { DrawUtilities } from "./helper/draw_utilities";
import { ElementManager } from "./helper/element_manager";
import { VisualElement } from "./helper/visual_element";

/**
 * The comparisonSort Class
 *
 * Due how SVGjs works, to actually display an svg element,
 * it needs a parent element. Therefore, the drawRoot
 * is given to this algorithm class, together with the width and the hight
 * of the svg element
 *
 * A limitation of the current approach:
 *
 * only unique values are allows, since the simple map, used in the element
 * mananger, maps number to visual element.
 *
 * so it will override any duplications
 *
 * TODO:
 * find a way, how the x- and y-position of an element can be intelligently guessed
 * since just adding
 */
export default class ComparisonSortsVisualizer {
  data: number[];
  private animationControl: AnimationController;
  private elementManager: ElementManager;
  private drawUtils: DrawUtilities;

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
    signal: string;
  };

  constructor(
    animationControl: AnimationController,
    drawRoot: G,
    width: number,
    height: number,
    length = 20
  ) {
    this.data = Array.from(new Set(generateData(length).map((e) => e + 1)));

    this.animationControl = animationControl;

    this.drawUtils = new DrawUtilities(drawRoot, width, height, this.data);
    this.elementManager = new ElementManager();

    this.colorMapping = {
      get: this.drawUtils.colors.Aqua,
      push: this.drawUtils.colors.Green,
      swap: this.drawUtils.colors.Red,
      compare: this.drawUtils.colors.Navy,
      splice: this.drawUtils.colors.Purple,
      shift: this.drawUtils.colors.Fuchsia,
      concat: this.drawUtils.colors.Lime,
      set: this.drawUtils.colors.Gray,
      default: this.drawUtils.colors.Silver,
      signal: this.drawUtils.colors.Yellow,
    };

    // create and add the the refsManager
    this.data.forEach((value) => {
      const el = new VisualElement(value, this.drawUtils);
      this.elementManager.setRef(value, el);
    });
  }

  /**
   * set to undefine, to let the GC do its work
   * This does not really work, does it?
   */
  dispose() {
    // @ts-ignore
    this.elementManager = undefined;
  }

  setupDone: Promise<void> = Promise.resolve();
  /** * must await setup! */
  setup() {
    const tl = this.animationControl.initTimeline;

    // position
    this.elementManager.forEachElement((d, i) => {
      // this lets everybody start at the same time
      const correct = i ? 50 : 0;
      tl.add(
        {
          targets: d.node,
          duration: 50,
          translateX: this.drawUtils.xScale(i),
          opacity: 1,
        },
        `-=${correct}`
      );
    });

    /// wait till timeline animation is done
    this.setupDone = tl.continue();
    return this.setupDone;
  }

  async visualizeSwap(array: Interpreter.Object, i: number, j: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual elements
    const el1 = ref.getByIndex(i);
    const el2 = ref.getByIndex(j);

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
        translateX: el2.xPixel, // move {groupI} by i
        duration: 400,
      })
      .add(
        {
          targets: el2.node,
          translateX: el1.xPixel, // move {groupJ} by j
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

  async visualizeCompare(
    array: Interpreter.Object,
    i: number,
    j: number,
    iGreaterJ: boolean
  ) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const el1 = ref.getByIndex(i);
    const el2 = ref.getByIndex(j);

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

  async visualizeHighlight(
    array: Interpreter.Object,
    value: number,
    timeCorrection: string = "-=0"
  ) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const el1 = ref.getByValue(value);
    if (!el1) return;

    // Highligh rects
    tl.add(
      {
        targets: el1.rectNode,
        fill: this.colorMapping.signal,
        duration: 300,
      },
      timeCorrection
    );
  }

  async visualizeUnHighlight(
    array: Interpreter.Object,
    value: number,
    timeCorrection: string = "-=0"
  ) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const el1 = ref.getByValue(value);
    if (!el1) return;

    // Highligh rects
    tl.add(
      {
        targets: el1.rectNode,
        fill: this.colorMapping.default,
        duration: 300,
      },
      timeCorrection
    );
  }
  awaitAnimation() {
    return this.animationControl.algoTimeline.continue();
  }

  async visualizeSplice(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);
    const first = ref?.getByIndex(0);

    if (!first) return;

    const translateY = first.yPixel + this.drawUtils.yScale(1);

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

  async visualizeShift(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    const first = ref?.getByIndex(0);
    if (!first) return;

    const translateX = first.xPixel;

    // move all elements to the left by 1 position, that are in that array
    tl.add({
      targets: first.rectNode,
      fill: this.colorMapping.shift,
      duration: 200,
    }).add({
      targets: first.node,
      duration: 500,
      opacity: 0,
      translateX: translateX + this.drawUtils.xScale(-1),
    });

    ref.forEach((d, i) => {
      if (d != first) {
        tl.add(
          {
            targets: d.node,
            duration: 400,
            translateX: translateX + this.drawUtils.xScale(i - 1),
          },
          "-=400"
        );
      }
    });

    return tl.continue();
  }

  async visualizePush(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.elementManager.getArrayWrapper(array);

    // get last element! since the value is already added by the interpreter!
    const group = ref.getByIndex(ref.length - 1);
    const first = ref.getByIndex(0);

    if (!group || !first) return;

    const newArray = ref.length == 1;

    const xy = this.elementManager.findFree(first, newArray);

    const translateY = newArray
      ? this.drawUtils.yScale(xy.y)
      : this.drawUtils.yScale(first.yIndex);

    const translateX = newArray
      ? this.drawUtils.xScale(xy.x)
      : first.xPixel + this.drawUtils.xScale(ref.length - 1);

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

  async visualizeConcat(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.elementManager.getArrayWrapper(array);
    const first = ref?.getByIndex(0);
    if (!first) return;

    const translateX = first.xPixel;
    const translateY = first.yPixel;

    tl.add({
      targets: ref.rectNodes,
      duration: 200,
      fill: this.colorMapping.concat,
    });

    ref.forEach((e, i) => {
      tl.add(
        {
          targets: e.node,
          duration: 500,
          translateX: translateX + this.drawUtils.xScale(i),
          translateY,
        },
        "-=200"
      );
    });

    return await tl.continue();
  }

  async visualizeSet(array: Interpreter.Object, i: number, value: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);
    const first = ref.getByIndex(0);

    if (!first) return;

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
      translateX: first.xPixel + this.drawUtils.xScale(i),
      translateY: first.yPixel,
      duration: 200,
    });

    await tl.continue();
  }

  async visualizeGet(array: Interpreter.Object, i: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getArrayWrapper(array);

    // get visual objects
    const group = ref.getByIndex(i);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!group) return;

    // Highligh rects
    tl.add({
      targets: group.rectNode,
      fill: this.colorMapping.get,
      duration: 100,
    }).add({
      targets: group.node,
      translateY: group.yPixel + this.drawUtils.yScale(1),
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
