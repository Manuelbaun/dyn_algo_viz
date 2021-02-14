import type AnimationController from "../animation/animation_controller";
import type Interpreter from "../interpreter/interpreter";
import type { DrawUtilities } from "./helper/draw_utilities";
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
    data: Array<number>,
    drawUtils: DrawUtilities
  ) {
    this.data = data;
    this.drawUtils = drawUtils;
    this.animationControl = animationControl;

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
      this.elementManager.setVisualElementRef(value, el);
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

  initializeDone: Promise<void> = Promise.resolve();
  /** * must await setup! */
  initialize() {
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
    this.initializeDone = tl.continue();
    return this.initializeDone;
  }

  async visualizeSwap(array: Interpreter.Object, i: number, j: number) {
    const tl = this.animationControl.algoTimeline;
    const ref = this.elementManager.getOrCreateArrayWrapper(array);

    // get visual elements
    const el1 = ref.getVisualElementByIndex(i);
    const el2 = ref.getVisualElementByIndex(j);

    // at this point, the js interpreter would have thrown an error
    if (!el1 || !el2) {
      throw Error(`Ein unerwarteter Fehler ist aufgetreten. 
      Die Elemente der Indizes [${i}, ${j}] sollten definiert sein.`);
    }

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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);

    // get visual objects
    const el1 = ref.getVisualElementByIndex(i);
    const el2 = ref.getVisualElementByIndex(j);

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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);

    // get visual objects
    const el1 = ref.getVisualElementByValue(value);
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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);

    // get visual objects
    const el1 = ref.getVisualElementByValue(value);
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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);
    const first = ref?.getVisualElementByIndex(0);

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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);

    const elFirst = ref.getVisualElementByIndex(0);
    if (!elFirst) return;

    const translateX = elFirst.xPixel;

    // move all elements to the left by 1 position, that are in that array
    tl.add({
      targets: elFirst.rectNode,
      fill: this.colorMapping.shift,
      duration: 200,
    }).add({
      targets: elFirst.node,
      duration: 500,
      opacity: 0,
      translateX: translateX + this.drawUtils.xScale(-1),
    });

    ref.forEachOverElements((d, i) => {
      if (d != elFirst) {
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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);
    let translateX, translateY;

    const elFirst = ref.getVisualElementByIndex(0);
    const elLast = ref.getVisualElementByIndex(ref.length - 1);

    if (!elFirst || !elLast) {
      throw Error(`Ein unerwarteter Fehler ist aufgetreten. 
      Die Elemente der Indizes [0, ${ref.length - 1}] sollten definiert sein.`);
    }

    if (elFirst == elLast) {
      const xy = this.elementManager.findFreePositionIn2DGrid(elFirst);
      translateY = this.drawUtils.yScale(xy.y);
      translateX = this.drawUtils.xScale(xy.x);
    } else {
      translateX = elFirst.xPixel + this.drawUtils.xScale(ref.length - 1);
      translateY = elFirst.yPixel;
    }

    tl.add({
      targets: elLast.node,
      duration: 400,
      translateX,
      translateY,
    })
      .add(
        {
          targets: elLast.rectNode,
          duration: 200,
          fill: this.colorMapping.push,
        },
        "-=400"
      )
      .add(
        {
          targets: elLast.node,
          duration: 200,
          opacity: 1,
        },
        "-=200"
      );

    await tl.continue();
  }

  async visualizeConcat(array: Interpreter.Object) {
    const tl = this.animationControl.algoTimeline;

    const ref = this.elementManager.getOrCreateArrayWrapper(array);
    const first = ref?.getVisualElementByIndex(0);
    if (!first) return;

    const translateX = first.xPixel;
    const translateY = first.yPixel;

    tl.add({
      targets: ref.rectNodes,
      duration: 200,
      fill: this.colorMapping.concat,
    });

    ref.forEachOverElements((e, i) => {
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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);
    const first = ref.getVisualElementByIndex(0);

    if (!first) return;

    // get visual objects
    const group = ref.getVisualElementByValue(value);

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
    const ref = this.elementManager.getOrCreateArrayWrapper(array);

    // get visual objects
    const group = ref.getVisualElementByIndex(i);

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
