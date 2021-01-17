import { scaleLinear, max, ScaleLinear } from "d3";
import type { PanZoom } from "panzoom";
import type { G, Rect, Text } from "@svgdotjs/svg.js";
import type AnimationController from "../animation/animation_controller";
import {
  generateData,
  getComputedTransform,
  genID,
} from "../utils/helper_functions";

import type Interpreter from "../interpreter/interpreter";

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
      // At this point,
      return;
    }

    const translateY = arrClaa.translateY + this.scales.y(1);
    const els = arrClaa.mapRef((el) => el.node);
    const rects = arrClaa.mapRef((el) => el.rectNode);

    tl.add({
      targets: rects,
      duration: 200,
      fill: this.colors.highlight,
    }).add({
      targets: els,
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

    const els = arrClaa.mapRef((el) => el.node);
    const rects = arrClaa.mapRef((el) => el.rectNode);

    tl.add({
      targets: rects,
      duration: 200,
      fill: this.colors.pop,
    }).add({
      targets: els,
      duration: 200,
      translateY,
    });

    arrClaa.forEachRef(async (e, i) => {
      tl.add({
        targets: e.node,
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

class ArrayRefManager {
  private _arrayRefs: Map<Interpreter.Object, ArrayRef> = new Map();
  private _groupRefs: Map<number, GroupRef> = new Map();

  drawSVG;
  constructor(drawSVG: G) {
    this.drawSVG = drawSVG;
  }

  has(array: Interpreter.Object) {
    return this._arrayRefs.has(array);
  }

  getArray(array: Interpreter.Object) {
    let arrClaa = this._arrayRefs.get(array);

    if (!arrClaa) {
      arrClaa = new ArrayRef(array, this._groupRefs, this.drawSVG);
      this._arrayRefs.set(array, arrClaa);
    }

    return arrClaa;
  }

  setRef(value: number, ref: GroupRef) {
    this._groupRefs.set(value, ref);
  }

  private get groupRefsList() {
    const values = this._groupRefs.values();
    return Array.from(values);
  }

  private get arrayRefsList() {
    const values = this._arrayRefs.values();
    /// TODO: should the empty objects been removed?
    return Array.from(values);
  }

  forEachRef(callbackfn: (element: GroupRef, index: number) => void) {
    this.groupRefsList.forEach((e, i, a) => callbackfn(e, i));
  }

  getAllYPos() {
    return (
      this.arrayRefsList
        .filter((e) => e.translateY != null)
        // here only existing values come
        .map((d) => d.translateY as number)
    );
  }
}

class ArrayRef {
  private internal;
  private groupRefs;
  private parentGroup;
  private _id: string;

  constructor(
    array: Interpreter.Object,
    groupRefs: Map<number, GroupRef>,
    parent: G
  ) {
    this.internal = array;
    this.groupRefs = groupRefs;
    this.parentGroup = parent.group();

    this._id = genID();
    this.parentGroup.attr("id", this._id);
  }

  get id() {
    return this._id;
  }

  get length() {
    return this.internal.properties.length;
  }

  get properties() {
    return this.internal.properties;
  }

  /** Get the matrix from the first element of the array */
  get matrix() {
    let matrix = this.getRef(0)?.matrix;
    if (!matrix) {
      // TODO: calcuclate free space?
      matrix = { translateX: 0, translateY: 0 };
      console.log("no element");
    }
    return matrix;
  }

  /** Get the translateX from the first element of the array */
  get translateX() {
    return this.matrix.translateX;
  }

  /** Get the translateY from the first element of the array */
  get translateY() {
    return this.matrix.translateY;
  }

  get(index: number) {
    return this.internal.properties[index];
  }

  getRef(index: number) {
    const val = this.get(index);
    const el = this.groupRefs.get(val);

    if (!el) {
      // TOOD: Think about this line ? try catch?
      // throw Error(`Cannot find Visual Group element at index:"${index}" with value: ${val}`);
    }

    if (el) this.parentGroup.add(el.g);
    return el;
  }

  forEach(callbackfn: (element: number, index: number, self: this) => void) {
    for (let i = 0; i < this.length; i++) {
      callbackfn(this.get(i), i, this);
    }
  }

  forEachRef(
    callbackfn: (element: GroupRef, index: number, self: this) => void
  ) {
    for (let i = 0; i < this.length; i++) {
      const el = this.getRef(i);
      if (el) {
        callbackfn(el, i, this);
      } else {
        console.error("The visual Element at index", i, "does not exist..");
      }
    }
  }

  mapRef<T>(
    callbackfn: (element: GroupRef, index: number, array: T[]) => T
  ): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.length; i++) {
      const el = this.getRef(i);

      if (el) {
        result.push(callbackfn(el, i, result));
      } else {
        console.error("The visual Element at index", i, "does not exist..");
      }
    }
    return result;
  }
}

class GroupRef {
  rectEl: Rect;
  textEl: Text;
  g: G;
  value: number;

  get node() {
    return this.g.node;
  }

  get rectNode() {
    return this.rectEl.node;
  }

  constructor({
    parent,
    scaleHeight,
    value,
    width,
    fill,
    bottomLine,
    fontsize = 10,
  }: {
    parent: G;
    scaleHeight: any;
    value: number;
    width: number;
    fill: string;
    fontsize: number;
    bottomLine: number;
  }) {
    // set initial transform of Y
    // const style = 'transform: translateY(' + this.scales.y(yPos) + 'px)';
    // const style = 'transform: translateY(' + 50 + 'px)';
    // create group element, to group rect and text together => less work
    this.g = parent.group().attr({ opacity: 0.0 });

    /// create rect in previous created group
    /// the dy(bottomline - height), means where to put the start of the bar
    /// since coordinate systems start from top left corner
    const height = scaleHeight(value);
    this.rectEl = this.g
      .rect(width, height)
      .attr({ fill })
      .dy(bottomLine - height);

    /// create text in previous created group
    this.textEl = this.g
      .text(`${value}`)
      .font({ size: fontsize })
      .dy(bottomLine);
    this.value = value;
  }

  get matrix() {
    const matrix = new WebKitCSSMatrix(this.node.style.transform);
    return { translateX: matrix.e, translateY: matrix.f };
  }
}
