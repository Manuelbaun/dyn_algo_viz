import type Interpreter from "../../interpreter/interpreter";
import { ArrayWrapper } from "./array_wrapper";
import type { VisualElement } from "./visual_element";

export class ElementManager {
  /** A map,of value to visual svg elements */
  private allVisualElements: Map<number, VisualElement> = new Map();
  /** Map of the interpreter Array to the wrapped classes */
  private wrappedArrays: Map<Interpreter.Object, ArrayWrapper> = new Map();

  /**
   * A very simple algorithm to find a free space in a 2d grid.
   * Starting point it x=0 and y=0 and searches first vertically,
   *
   * Creates a 2d Array, where 0 represents the absents of an visual element
   * and 1 represents the present of an visual element
   */
  findFreePositionIn2DGrid(forElement: VisualElement) {
    const els = Array.from(this.allVisualElements.values()).filter(
      (e) => e != forElement
    );

    // y-x 2d matrix
    const m = Array<number>(els.length)
      .fill(0)
      .map((v, i) => Array<number>(els.length).fill(0));

    const easyLineCounter: number[] = Array<number>(els.length).fill(0);

    els.forEach(({ xIndex: x, yIndex: y }) => {
      m[y][x] = 1;
      easyLineCounter[y] += 1;
    });

    let y: number = 0,
      x: number = 0;

    for (y = 0; y < m.length; y++) {
      // check if line is to full > 50%
      if (easyLineCounter[y] / m.length > 0.6) continue;

      let spots = 0;

      // check also one on the right..
      for (x = 0; x < m.length; x++) {
        if (m[y][x] == 0) spots += 1;
        else if (m[y][x] != 0) spots = 0;

        if (spots >= 2) break;
      }

      console.log(spots, length, { x: x - (spots - 1), y });
      if (spots >= 2) {
        return { x: x - (spots - 1), y };
      }
    }

    return {
      x: m[forElement.yIndex].findIndex((e) => e == 0),
      y: forElement.yIndex,
    };
  }

  getOrCreateArrayWrapper(array: Interpreter.Object) {
    let arr = this.wrappedArrays.get(array);

    if (!arr) {
      arr = new ArrayWrapper(array, this.allVisualElements);
      this.wrappedArrays.set(array, arr);
    }

    return arr;
  }

  /**
   * @param value the value is the hight of the rectangle bar
   * @param ref  is the svg groupref of the rectangle bar and the text
   */
  setVisualElementRef(value: number, ref: VisualElement) {
    this.allVisualElements.set(value, ref);
  }

  forEachElement(cb: (element: VisualElement, index: number) => void) {
    Array.from(this.allVisualElements.values()).forEach((e, i) => cb(e, i));
  }
}

export function matrix(styleTransfrom: string) {
  const matrix = new WebKitCSSMatrix(styleTransfrom);
  return { translateX: matrix.e, translateY: matrix.f };
}
