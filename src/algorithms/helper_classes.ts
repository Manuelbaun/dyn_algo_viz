import type { Circle, G, Rect, Text } from "@svgdotjs/svg.js";
import type Interpreter from "../interpreter/interpreter";
import { genID } from "../utils/helper_functions";
import { max, scaleLinear, ScaleLinear } from "d3";

type Scales = {
  x: ScaleLinear<number, number, never>;
  y: ScaleLinear<number, number, never>;
  yHeight: ScaleLinear<number, number, never>;
};

export class DrawBasic {
  colors = {
    pink: "#f06", // Pink
    green: "#FFFF00", // Green
    yellow: "#22FF00", // Yellow
    blue: "#0089FF", // Blue
    orange: "#FFCD00", // Orange
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

export class VisualElement {
  // the root group, which contains the text and rectangle
  root: G;
  rectEl: Rect;
  textEl: Text;
  value: number;
  draw: DrawBasic;

  private scales: Scales;
  constructor(value: number, draw: DrawBasic) {
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
      .attr({ fill: this.draw.colors.pink })
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
  get posX() {
    return this.matrix.translateX;
  }

  // Pixel Y position of the element
  get posY() {
    return this.matrix.translateY;
  }

  private get matrix() {
    const matrix = new WebKitCSSMatrix(this.node.style.transform);
    return { translateX: matrix.e, translateY: matrix.f };
  }
}

/**
 * Utilityclass to wrap the interpreter array (object)
 * and gives severy utility methods
 */
export class ArrayWrapper {
  private self;
  private groupRefs;

  readonly id: string = genID();

  constructor(
    array: Interpreter.Object,
    groupRefs: Map<number, VisualElement>
  ) {
    this.self = array;
    this.groupRefs = groupRefs;
  }

  get length() {
    return this.self.properties.length;
  }

  get properties() {
    return this.self.properties;
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

  getByValue(value: number) {
    return this.groupRefs.get(value);
  }

  getRef(index: number) {
    const val = this.get(index);
    return this.getByValue(val);
  }

  forEach(cb: (element: number, index: number, self: this) => void) {
    for (let i = 0; i < this.length; i++) {
      cb(this.get(i), i, this);
    }
  }

  forEachRef(cb: (element: VisualElement, index: number, self: this) => void) {
    for (let i = 0; i < this.length; i++) {
      const el = this.getRef(i);
      if (el) {
        cb(el, i, this);
      } else {
        console.error("The visual Element at index", i, "does not exist..");
      }
    }
  }

  mapRef<T>(cb: (element: VisualElement, index: number, array: T[]) => T): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.length; i++) {
      const el = this.getRef(i);

      if (el) {
        result.push(cb(el, i, result));
      } else {
        throw Error(`The visual Element at index ${i} does not exist.`);
      }
    }
    return result;
  }
}

export class ElementRefManager {
  /** Map of the interpreter Array to the wrapped classes */
  private wrappedArrays: Map<Interpreter.Object, ArrayWrapper> = new Map();

  /** A map,of value to visual svg elements */
  private elements: Map<number, VisualElement> = new Map();

  private get groupRefsList() {
    // todo memoize
    return Array.from(this.elements.values());
  }

  has(array: Interpreter.Object) {
    return this.wrappedArrays.has(array);
  }

  getArrayWrapper(array: Interpreter.Object) {
    let arrClaa = this.wrappedArrays.get(array);

    if (!arrClaa) {
      arrClaa = new ArrayWrapper(array, this.elements);
      this.wrappedArrays.set(array, arrClaa);
    }

    return arrClaa;
  }

  /**
   * @param value the value is the hight of the rectangle bar
   * @param ref  is the svg groupref of the rectangle bar and the text
   */
  setRef(value: number, ref: VisualElement) {
    this.elements.set(value, ref);
  }

  forEachRef(callbackfn: (element: VisualElement, index: number) => void) {
    this.groupRefsList.forEach((e, i) => callbackfn(e, i));
  }
}
