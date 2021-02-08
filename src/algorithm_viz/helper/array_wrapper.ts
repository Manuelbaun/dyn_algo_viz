import type Interpreter from "../../interpreter/interpreter";
import { genID } from "../../utils/helper_functions";
import type { VisualElement } from "./visual_element";

/**
 * Utilityclass to wrap the interpreter.object (array)
 * and gives some utility methods
 */
export class ArrayWrapper {
  private self;
  private allElementRefs;
  readonly id: string = genID();

  constructor(
    array: Interpreter.Object,
    allElementRefs: Map<number, VisualElement>
  ) {
    this.self = array;
    this.allElementRefs = allElementRefs;
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
    return this.map((e) => e.rectNode);
  }

  // access the svg group node, to translate etc the group
  // setting color on the group element wont work
  get groupNodes() {
    return this.map((e) => e.node);
  }

  private get(index: number) {
    return this.self.properties[index];
  }

  getByValue(value: number) {
    return this.allElementRefs.get(value);
  }

  getByIndex(index: number) {
    const val = this.get(index);
    return this.getByValue(val);
  }

  forEachByIndex(cb: (element: number, index: number, self: this) => void) {
    for (let i = 0; i < this.length; i++) {
      cb(this.get(i), i, this);
    }
  }

  forEach(cb: (element: VisualElement, index: number, self: this) => void) {
    for (let i = 0; i < this.length; i++) {
      const el = this.getByIndex(i);
      if (el) {
        cb(el, i, this);
      } else {
        console.error("The visual Element at index", i, "does not exist..");
      }
    }
  }

  map<T>(cb: (element: VisualElement, index: number, array: T[]) => T): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.length; i++) {
      const el = this.getByIndex(i);

      if (el) {
        result.push(cb(el, i, result));
      } else {
        throw Error(`The visual Element at index ${i} does not exist.`);
      }
    }
    return result;
  }
}