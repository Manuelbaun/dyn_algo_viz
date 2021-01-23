import type { G, Rect, Text } from "@svgdotjs/svg.js";
import type Interpreter from "../interpreter/interpreter";
import { genID } from "../utils/helper_functions";
import { max, scaleLinear, ScaleLinear } from "d3";

type Scales = {
  x: ScaleLinear<number, number, never>;
  y: ScaleLinear<number, number, never>;
  xInv: (val: number) => number;
  yInv: (val: number) => number;
  yHeight: ScaleLinear<number, number, never>;
};

export class DrawBasic {
  // https://htmlcolorcodes.com/
  colors = {
    White: "#FFFFFF",
    Silver: "#C0C0C0",
    Gray: "#808080",
    Black: "#000000",
    Red: "#FF0000",
    Maroon: "#800000",
    Yellow: "#FFFF00",
    Olive: "#808000",
    Lime: "#00FF00",
    Green: "#008000",
    Aqua: "#00FFFF",
    Teal: "#008080",
    Blue: "#0000FF",
    Navy: "#000080",
    Fuchsia: "#FF00FF",
    Purple: "#800080",
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
        .range([0, height / 2]),
      xInv: (val: number) => val / xStep,
      yInv: (val: number) => val / yStep,
      yHeight: scaleLinear()
        .domain([0, max(data)] as number[]) // the max value of the data
        .range([0, height / 2 - this.margin.top - 20]), // height minus bottom marginopen
    };

    const xStep = this.scales.x(1);
    const yStep = this.scales.y(1);

    console.log(
      Array(10)
        .fill(0)
        .map((e, i) => this.scales.y(i))
    );
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
      .attr({ fill: this.draw.colors.Silver })
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
    return Math.round(this.scales.xInv(this.matrix.translateX));
  }

  // Y position of the element (invert of the scales)
  get y() {
    // normally d3 scale have an inverse function,
    // but it does not work properly on the y scale???
    // bug in y.inverse()
    return Math.round(this.scales.yInv(this.matrix.translateY));
  }

  // Pixel X position of the element
  get posX() {
    return this.matrix.translateX;
  }

  // Pixel Y position of the element
  get posY() {
    return this.matrix.translateY;
  }

  /**
   * Unfortunately, the SVGjs lib does not work 100% with the animation
   * of animejs. The Transform property of the svg elements from a group
   * uses a matrix. Animejs uses the style.transfrom
   *
   * this is a workaround
   */
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
  drawing: DrawBasic;

  constructor(drawing: DrawBasic) {
    this.drawing = drawing;
  }
  private get groupRefsList() {
    // todo memoize
    return Array.from(this.elements.values());
  }

  helpMatrix(first: VisualElement) {
    const els = Array.from(this.elements.values()).filter((e) => e != first);

    // y-x 2d matrix
    const m = Array<number>(els.length)
      .fill(0)
      .map((v, i) => Array<number>(els.length).fill(0));

    els.forEach(({ x, y }) => (m[y][x] = 1));

    return m;
  }

  /**
   * A very simple algorithm, to find a free space, in that "2d" grid.
   * This algorithm is not working properly and needs more checks
   * @param first
   * @param any
   */
  findFree(first: VisualElement, any: boolean) {
    const m = this.helpMatrix(first);

    let y: number, x: number;

    if (any) {
      for (x = first.x; x < 8; x++) {
        for (y = 1; y < 8; y++) {
          // check also one on the left..
          if (m[y][x] == 0 && m[y][x + 1] == 0 && m[y][x + 2] == 0) {
            // console.log("MATRIX:", m, { x, y });
            return { x, y };
          }
        }
      }
    }
    return { x: m[first.y].findIndex((e) => e == 0), y: first.y };
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

export function matrix(styleTransfrom: string) {
  const matrix = new WebKitCSSMatrix(styleTransfrom);
  return { translateX: matrix.e, translateY: matrix.f };
}
