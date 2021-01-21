import { scaleLinear, max, ScaleLinear } from "d3";
import type { PanZoom } from "panzoom";
import type { G } from "@svgdotjs/svg.js";
import type AnimationController from "../animation/animation_controller";
import { generateData } from "../utils/helper_functions";

import type Interpreter from "../interpreter/interpreter";
import { ArrayRef, ArrayRefManager, GroupRef } from "./helper_classes";

/**
 * Type declarations
 */
type DrawUtils = {
  svg: G;
  svgWidth: any;
  svgHeight: any;
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  drawHeight: number;
  drawWidth: number;
  bottomLine: number;
  rect: {
    width: number;
  };
};

/** The comparisonSort Class */
export default class ComparisonSorts {
  private colors = {
    base: "#f06", // Pink
    check: "#FFFF00", // Green
    highlight: "#22FF00", // Yellow
    pop: "#0089FF", // Blue
    push: "#FFCD00", // Orange
  };

  private controller: {
    panZoomControl: PanZoom;
    animationControl: AnimationController;
  };

  private draw: DrawUtils;

  private scales: {
    x: ScaleLinear<number, number, never>;
    y: ScaleLinear<number, number, never>;
    yHeight: ScaleLinear<number, number, never>;
  };

  data: number[];

  refsManager;
  // stream: flyd.Stream<any>;

  constructor(animationControl: AnimationController, svgJS: any, length = 10) {
    const { svg, panZoomControl, viewBox } = svgJS;
    const { width: svgWidth, height: svgHeight } = viewBox;

    this.refsManager = new ArrayRefManager(svg);

    this.controller = {
      panZoomControl,
      animationControl,
    };

    this.data = generateData(length);

    const margin = {
      top: 50,
      bottom: 50,
      left: 20,
      right: 20,
    };

    const drawHeight = svgHeight - margin.top - margin.bottom;
    const drawWidth = svgWidth - margin.left - margin.right;
    const bottomLine = svgHeight - margin.bottom;

    this.draw = {
      svg,
      svgWidth,
      svgHeight,
      margin,
      drawHeight,
      drawWidth,
      bottomLine,
      rect: {
        width: drawWidth / length - 2.5,
      },
    };

    /**
     * Scales, to map between pixels and the data vales
     * domain: data domain
     * range from to pixels
     */
    this.scales = {
      x: scaleLinear().domain([0, length]).range([0, svgWidth]),
      y: scaleLinear()
        .domain([0, 1])
        .range([margin.top, svgHeight / 2]),
      yHeight: scaleLinear()
        .domain([0, max(this.data)] as number[]) // the max value of the data
        .range([0, svgHeight / 2]), // height minus bottom marginopen
    };

    /** Enable autoFit */

    // this.stream = streamManager
    //   .createSubStream(["animation", "status"] as const)
    //   .map((value) => {
    //     if (value == "COMPLETE") {
    //       // svgJS.zoomFit();
    //     }
    //     // actions.setLocalScope();
    //     // actions.setLocalScope(this.datas.toJson());
    //     // console.log(this.datas, this.shiftedElements);
    //     //   if (data.action == 'begin') {
    //     //     const pz = this.controller.panZoomControl;
    //     //     const box = this.draw.svg.bbox();
    //     //     console.log(box);
    //     //     pz.centerOn(this.draw.svg.node);
    //     //     pz.smoothZoomAbs(box.cx, box.cy, 0.5);
    //     //     const json = this.datas.toJson();
    //     // })
    //   });
  }

  dispose() {}

  async setup() {
    const { initTimeline: tl } = this.controller.animationControl;
    const { svg, bottomLine } = this.draw;

    // create and add the the refsManager
    this.data.forEach((value) => {
      const g = new GroupRef({
        parent: svg,
        scaleHeight: this.scales.yHeight,
        bottomLine,
        fill: this.colors.base,
        value,
        width: this.draw.rect.width,
        fontsize: 10,
      });
      this.refsManager.setRef(value, g);
    });

    // position
    this.refsManager.forEachRef((d, i) => {
      tl.add({
        targets: d.node,
        duration: 200,
        translateX: this.scales.x(i),
        opacity: 1,
      });
    });

    await tl.continue();

    // /// clone
    // const cloneGroup = svg.group();
    // Array.from(this.groupRefs.values()).forEach((e) => {
    //   const c = e.g.clone();
    //   c.attr('opacity', 0.1);
    //   cloneGroup.add(c);
    // });
    /// wait till timeline animation is done
    return await tl.continue();
  }

  async swap(array: Interpreter.Object, i: number, j: number) {
    const { algoTimeline: tl } = this.controller.animationControl;

    const ref = this.refsManager.getArray(array);

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
      fill: this.colors.highlight,
      duration: 100,
    });

    await tl.continue();

    tl.add({
      targets: gi.node,
      translateX: gj.matrix.translateX, // move {groupI} by i
      duration: 250,
    }).add(
      {
        targets: gj.node,
        translateX: gi.matrix.translateX, // move {groupJ} by j
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
      fill: this.colors.base,
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
    const { algoTimeline: tl } = this.controller.animationControl;
    const arrClaa = this.refsManager.getArray(array);

    // get visual objects
    const rv = arrClaa.getRef(i);
    const rw = arrClaa.getRef(j);

    // if an element at pos i or j does not exist, the interpreter would have thrown error
    if (!rv || !rw) return;

    const rects = [rv.rectNode, rw.rectNode];

    // Highligh rects
    tl.add({
      targets: rects,
      fill: this.colors.check,
      duration: 200,
    });
    await tl.continue();

    // unHighligh rects
    if (!iGreaterJ) {
      tl.add({
        targets: rects,
        fill: this.colors.base,
        duration: 100,
      });
    }

    // dont forget to call continue, since the animation of algotimeline
    // wont start automatically. This was disabled, in the controller
    return await tl.continue();
  }

  async splice(array: Interpreter.Object) {
    const { algoTimeline: tl } = this.controller.animationControl;
    const arrClaa = this.refsManager.getArray(array);

    if (!arrClaa.translateX) {
      return;
    }

    const translateY = arrClaa.translateY + this.scales.y(1);

    tl.add({
      targets: arrClaa.rectNodes,
      duration: 200,
      fill: this.colors.highlight,
    }).add({
      targets: arrClaa.groupNodes,
      duration: 200,
      translateY,
    });

    return await tl.continue();
  }

  async shift(array: Interpreter.Object) {
    const { algoTimeline: tl } = this.controller.animationControl;
    const arrClaa = this.refsManager.getArray(array);

    /// needs the last reference position, since value is already gone from [arrClaa]
    const ref = arrClaa.getRef(0);
    if (!ref) return;

    const translateX = ref.matrix.translateX;

    // move all elements to the left by 1 position, that are in that array
    arrClaa.forEachRef((d, i) => {
      tl.add({
        targets: d.node,
        duration: 100,
        translateX: translateX + this.scales.x(i - 1),
      });
    });

    // shift, first element to the left
    tl.add({
      targets: ref.node,
      duration: 50,
      opacity: 0,
      translateX: translateX - this.scales.x(1),
    }).add(
      {
        targets: ref.rectNode,
        fill: this.colors.pop,
        duration: 50,
      },
      "-=50"
    );

    return tl.continue();
  }

  async push(array: Interpreter.Object) {
    const { algoTimeline: tl } = this.controller.animationControl;

    const isNewArray = this.refsManager.has(array);
    const arrClaa = this.refsManager.getArray(array);
    // get last element!
    const ref = arrClaa.getRef(arrClaa.length - 1);
    if (!ref) return;

    const matrix = arrClaa.matrix;
    const translateX = matrix.translateX + this.scales.x(arrClaa.length);

    let translateY;
    if (isNewArray) {
      translateY =
        Math.max(...this.refsManager.getAllYPos()) + this.scales.y(1);
    } else {
      translateY = matrix.translateY;
    }

    tl.add({
      targets: ref.node,
      duration: 200,
      delay: 0,
      translateX,
      translateY,
      opacity: 1,
    }).add(
      {
        targets: ref.rectNode,
        duration: 200,
        fill: this.colors.push,
      },
      "-=100"
    );

    return tl.continue();
  }

  async concat(array: Interpreter.Object) {
    const { algoTimeline: tl } = this.controller.animationControl;

    const arrClaa = this.refsManager.getArray(array);
    const matrix = arrClaa.matrix;
    const translateY = matrix.translateY + this.scales.y(1);
    const translateX = matrix.translateX;

    tl.add({
      targets: arrClaa.rectNodes,
      duration: 200,
      fill: this.colors.pop,
    }).add({
      targets: arrClaa.groupNodes,
      duration: 200,
      translateY,
    });

    arrClaa.groupNodes.forEach(async (e, i) => {
      tl.add({
        targets: e,
        duration: 100,
        translateX: translateX + this.scales.x(i),
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

    const { algoTimeline: tl } = this.controller.animationControl;

    const clonedElements = clones.map((e) => {
      const clone = e.g.clone();
      clone.attr("opacity", 0);
      return clone;
    });

    const parent = clones[0].g.parent() as G;
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
