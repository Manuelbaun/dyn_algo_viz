import type Interpreter from "../../interpreter/interpreter";
import { ArrayWrapper } from "./array_wrapper";
import type { VisualElement } from "./visual_element";

export class ElementManager {
  /** Map of the interpreter Array to the wrapped classes */
  private wrappedArrays: Map<Interpreter.Object, ArrayWrapper> = new Map();

  /** A map,of value to visual svg elements */
  private elements: Map<number, VisualElement> = new Map();

  // todo memoize
  private get elementsAsList() {
    return Array.from(this.elements.values());
  }

  /**
   * Creates a 2d Array, where 0 represets the absents of an visual element
   * and 1 represents the present of an visual element
   * @param first
   */
  private helpMatrix(first: VisualElement) {
    const els = Array.from(this.elements.values()).filter((e) => e != first);

    // y-x 2d matrix
    const m = Array<number>(els.length)
      .fill(0)
      .map((v, i) => Array<number>(els.length).fill(0));

    els.forEach(({ xIndex: x, yIndex: y }) => (m[y][x] = 1));

    return m;
  }

  /**
   * A very simple algorithm to find a free space in a 2d grid.
   * Starting point it x=0 and y=0 and searches first vertically,
   * This algorithm needs more checks
   */
  findFree(first: VisualElement, findFreeSpot: boolean = false) {
    const m = this.helpMatrix(first);

    let y: number, x: number;

    if (findFreeSpot) {
      for (x = 0; x < m.length; x++) {
        for (y = 0; y < m.length; y++) {
          // check also one on the left..
          if (m[y][x] == 0 && m[y][x + 1] == 0) {
            return { x, y };
          }
        }
      }
    }

    return { x: m[first.yIndex].findIndex((e) => e == 0), y: first.yIndex };
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

  forEachElement(callbackfn: (element: VisualElement, index: number) => void) {
    this.elementsAsList.forEach((e, i) => callbackfn(e, i));
  }
}

export function matrix(styleTransfrom: string) {
  const matrix = new WebKitCSSMatrix(styleTransfrom);
  return { translateX: matrix.e, translateY: matrix.f };
}