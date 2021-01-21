import type { G, Rect, Text } from "@svgdotjs/svg.js";
import type Interpreter from "../interpreter/interpreter";
import { genID } from "../utils/helper_functions";
import { max, scaleLinear, ScaleLinear } from "d3";

export type Scales = {
  x: ScaleLinear<number, number, never>;
  y: ScaleLinear<number, number, never>;
  yHeight: ScaleLinear<number, number, never>;
};

export class DrawBasic {
  colors = {
    base: "#f06", // Pink
    check: "#FFFF00", // Green
    highlight: "#22FF00", // Yellow
    pop: "#0089FF", // Blue
    push: "#FFCD00", // Orange
  };

  drawRoot: G;
  svgWidth: number;
  svgHeight: number;

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

  scales: Scales;

  constructor(drawRoot: G, viewBox: any, data: number[]) {
    const { width, height } = viewBox;

    this.margin = {
      top: 50,
      bottom: 50,
      left: 20,
      right: 20,
    };

    this.drawRoot = drawRoot;
    this.svgHeight = height;
    this.svgWidth = width;

    this.drawHeight = height - this.margin.top - this.margin.bottom;
    this.drawWidth = width - this.margin.left - this.margin.right;
    this.bottomLine = height - this.margin.bottom;

    const length = data.length;
    this.rect = {
      width: this.drawWidth / length - 2.5,
    };

    console.log(length);
    /**
     * Scales, to map between pixels and the data vales
     * domain: data domain
     * range from to pixels
     */
    this.scales = {
      x: scaleLinear().domain([0, length]).range([0, width]),
      y: scaleLinear()
        .domain([0, 1])
        .range([this.margin.top, height / 2]),
      yHeight: scaleLinear()
        .domain([0, max(data)] as number[]) // the max value of the data
        .range([0, height / 2]), // height minus bottom marginopen
    };
  }
}

export class GroupRef {
  // the root group, which contains the text and rectangle
  root: G;
  rectEl: Rect;
  textEl: Text;
  value: number;
  draw: DrawBasic;

  private scales: Scales;
  constructor({ value, draw }: { value: number; draw: DrawBasic }) {
    this.draw = draw;
    // set initial transform of Y
    // create group element, to group rect and text together => less work
    this.root = draw.drawRoot.group().attr({ opacity: 0.0 });
    this.scales = this.draw.scales;
    this.value = value;

    /// create rect in previous created group
    /// the dy(bottomline - height), means where to put the start of the bar
    /// since coordinate systems start from top left corner
    const height = this.draw.scales.yHeight(value);

    this.rectEl = this.root
      .rect(this.draw.rect.width, height)
      .attr({ fill: this.draw.colors.base })
      .dy(this.draw.bottomLine - height);

    /// create text in previous created group
    this.textEl = this.root
      .text(value.toString())
      .font({ size: 10 })
      .dy(this.draw.bottomLine);
  }

  get node() {
    return this.root.node;
  }

  get rectNode() {
    return this.rectEl.node;
  }

  // X position of the element (invert of the scales)
  get x() {
    const m = this.matrix;
    return this.scales.x.invert(m.translateX);
  }

  // Y position of the element (invert of the scales)
  get y() {
    const m = this.matrix;
    return this.scales.y.invert(m.translateY);
  }

  // Pixel X position of the element
  get xPos() {
    return this.matrix.translateX;
  }

  // Pixel Y position of the element
  get yPos() {
    return this.matrix.translateY;
  }

  get matrix() {
    const matrix = new WebKitCSSMatrix(this.node.style.transform);
    return { translateX: matrix.e, translateY: matrix.f };
  }
}

export class ArrayRef {
  private self;
  private groupRefs;
  private parentGroup;
  readonly id: string = genID();

  constructor(
    array: Interpreter.Object,
    groupRefs: Map<number, GroupRef>,
    parent: G
  ) {
    this.self = array;
    this.groupRefs = groupRefs;
    this.parentGroup = parent.group();

    this.parentGroup.attr("id", this.id);
  }

  get length() {
    return this.self.properties.length;
  }

  get properties() {
    return this.self.properties;
  }

  /** Get the matrix from the first element of the array */
  get matrix() {
    let matrix = this.getRef(0)?.matrix;
    if (!matrix) {
      // TODO: calcuclate free space?
      matrix = { translateX: 0, translateY: 0 };
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

  // Access the rectangle svg nodes directly to only color them!!!
  // do not tranlate them here
  get rectNodes() {
    return this.mapRef((e) => e.rectEl.node);
  }

  // access the svg group node, to translate etc the group
  // setting color on the group element wont work
  get groupNodes() {
    return this.mapRef((e) => e.node);
  }

  private get(index: number) {
    return this.self.properties[index];
  }

  getRef(index: number) {
    const val = this.get(index);
    const el = this.groupRefs.get(val);

    if (el) this.parentGroup.add(el.root);
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
      console.log(i, this.length);
      const el = this.getRef(i);

      if (el) {
        result.push(callbackfn(el, i, result));
      } else {
        console.error("The visual Element at index", i, "does not exist..");
        throw Error("does not work");
      }
    }
    return result;
  }
}

export class ArrayRefManager {
  /**
   * ArrayRefs are the arrays from the interpreter
   */
  private arrayRefs: Map<Interpreter.Object, ArrayRef> = new Map();

  /**
   * A map, to map the (rectangle hight)/the init array value to the visual svg elements
   */
  private groupRefs: Map<number, GroupRef> = new Map();

  drawRoot;
  constructor(drawRoot: G) {
    this.drawRoot = drawRoot;
  }

  has(array: Interpreter.Object) {
    return this.arrayRefs.has(array);
  }

  getArrayRef(array: Interpreter.Object) {
    let arrClaa = this.arrayRefs.get(array);

    if (!arrClaa) {
      arrClaa = new ArrayRef(array, this.groupRefs, this.drawRoot);
      this.arrayRefs.set(array, arrClaa);
    }

    return arrClaa;
  }

  /**
   *
   * @param value the value is the hight of the rectangle bar
   * @param ref  is the svg groupref of the rectangle bar and the text
   */
  setRef(value: number, ref: GroupRef) {
    this.groupRefs.set(value, ref);
  }

  private get groupRefsList() {
    const values = this.groupRefs.values();
    return Array.from(values);
  }

  private get arrayRefsList() {
    const values = this.arrayRefs.values();
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
