import type { G, Rect, Text } from "@svgdotjs/svg.js";
import type Interpreter from "../interpreter/interpreter";
import { genID } from "../utils/helper_functions";

export class GroupRef {
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

export class ArrayRef {
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
      // console.log("no element");
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

export class ArrayRefManager {
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
