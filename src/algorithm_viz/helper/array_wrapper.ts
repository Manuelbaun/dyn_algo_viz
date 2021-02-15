import type Interpreter from "../../interpreter/interpreter";
import type { VisualElement } from "./visual_element";

/**
 * Utility class to wrap the interpreter.object (array)
 * and gives some utility methods
 */
export class ArrayWrapper {
  private self: Interpreter.Object;
  private allVisualElements: Map<number, VisualElement>;

  constructor(
    array: Interpreter.Object,
    allElementRefs: Map<number, VisualElement>
  ) {
    this.self = array;
    this.allVisualElements = allElementRefs;
  }

  get length() {
    return this.self.properties.length;
  }

  // Access the rectangle svg nodes directly to only color them!!!
  // do not translate them here
  get rectNodes() {
    return this.mapOverElements((e) => e.rectNode);
  }

  // access the svg group node, to translate etc the group
  // setting color on the group element wont work
  get groupNodes() {
    return this.mapOverElements((e) => e.rootNode);
  }

  get(index: number) {
    return this.self.properties[index];
  }

  getVisualElementByValue(value: number) {
    return this.allVisualElements.get(value);
  }

  getVisualElementByIndex(index: number) {
    const val = this.get(index);
    return this.getVisualElementByValue(val);
  }

  forEachOverProperties(cb: (value: any, index: number, self: this) => void) {
    for (let i = 0; i < this.length; i++) {
      cb(this.get(i), i, this);
    }
  }

  forEachOverElements(
    cb: (element: VisualElement, index: number, self: this) => void
  ) {
    for (let i = 0; i < this.length; i++) {
      const el = this.getVisualElementByIndex(i);
      if (el) {
        cb(el, i, this);
      } else {
        console.error("The visual Element at index", i, "does not exist..");
      }
    }
  }

  mapOverElements<T>(cb: (element: VisualElement, index: number, self: T[]) => T): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.length; i++) {
      const el = this.getVisualElementByIndex(i);

      if (el) {
        result.push(cb(el, i, result));
      } else {
        throw Error(`The visual Element at index ${i} does not exist.`);
      }
    }
    return result;
  }
}
