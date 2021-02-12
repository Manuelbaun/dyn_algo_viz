import Interpreter from "./interpreter";

import type { AppState } from "../service/app_state";
import type { EVENTS, STATE } from "../service/store_types";
import type ComparisonSortsVisualizer from "../algorithm_viz/comparison_sort_visualizer";

export class InterpreterWrapper {
  private algorithm: ComparisonSortsVisualizer;
  private paused: boolean;
  private initDone: boolean;
  private interpreter: Interpreter;
  private appState: AppState;
  private lastBreakPoint: number[] = [];
  private unsubscriber: Function[] = [];
  constructor(appState: AppState, algorithm: ComparisonSortsVisualizer) {
    this.appState = appState;
    this.algorithm = algorithm;

    // should be from app state!
    this.paused = false;
    this.initDone = false;

    const initFunction = this.interpreterInitFunctions.bind(this);

    // setup the interpreter, but add user code, only when start button is pressed
    // see start method.
    this.interpreter = new Interpreter("", initFunction);

    this.unsubscriber.push(
      appState.event.subscribe((e) => this.handleEvents(e))
    );
  }

  private async handleEvents(event: EVENTS) {
    console.log(event);
    if (event == "start") {
      await this.algorithm.setupDone;
      this.interpreter.appendCode(this.appState.sourceCodeValue);

      this.mainExecutingLoop();
    } else if (event === "continue") {
      this.mainExecutingLoop();
    } else if (event == "stepin" || event == "step") {
      const state = this.interpreter.stateStack.getTop();
      const paused = this.paused;
      this.paused = false;
      const res = this.interpreter.step();
      this.paused = paused;

      this.appState.setMarkedNode(state.node, "#ffaafa");
      this.appState.setLocalScope(this.getLocalScope(state.scope));
    }
  }

  private interpreterInitFunctions(
    self: Interpreter,
    globalObject: Interpreter.Object
  ) {
    // extra variable for algorithm, since the context within the wrapper is a different one!
    // and this.algorithm wont be available within the wrapper functions
    const algorithm = this.algorithm;
    /**
     * A utility function to stop the interpreter running and await async functions, then continue
     * when the interpreter was in runnning state!
     * It is expected, that the func returns a promise, or multiple Promises
     * @private
     */
    const asyncCall = async (
      func: (() => Promise<any>) | (() => Promise<any>[])
    ) => {
      const paused = this.paused;
      this.paused = true;

      if (func instanceof Array) {
        await Promise.all(func);
      } else {
        await func();
      }

      this.paused = paused;

      /**
       * If interpreter was in running mode, => continue to execute
       * This needs to done, since, this function could also be called, when
       * the stepping mode is active
       */
      if (this.appState.isRunning && paused == false) {
        this.mainExecutingLoop();
      }
    };

    /**
     * Function to highlight the code line
     * and store local Scope at that node/state
     * @param {string} color
     */
    const highlightAndScope = (color: string) => {
      const state = self.stateStack.getTop();
      this.appState.setMarkedNode(state.node, color, true);
      this.appState.setLocalScope(this.getLocalScope(state.scope), true);
    };

    /** **************** **/
    /** Define Props     **/
    /** **************** **/
    const root = self.nativeToPseudo(algorithm.data);
    console.log(root);
    if (root) {
      // @ts-ignore
      root.id = "root";
    }
    self.setProperty(globalObject, "root", root);

    /** **************** **/
    /** Define functions **/
    /** **************** **/
    self.setProperty(
      globalObject,
      "print",
      self.createNativeFunction(function (...args: any[]) {
        const node = self.stateStack.getTop().node;
        const printLine = "print:" + node.loc.start.line;
        try {
          if (args instanceof Array) {
            const res = args.map((e) => self.pseudoToNative(e));

            console.log(printLine, ...res);
          } else {
            const res = self.pseudoToNative(args);
            console.log(printLine, res);
          }
        } catch (e) {
          console.log(e);
          console.log(printLine, args);
        }
      }, false)
    );

    /** *************************************** **/
    /** Define/Override Array prototype methods **/
    /** *************************************** **/

    /// extends the array prototype of the interpreter! with a compare function
    self.setNativeFunctionPrototype(
      self.ARRAY,
      "compare",
      function (i: number, j: number) {
        const arr = this.properties;
        const res = arr[i] > arr[j];

        if (res == null) {
          self.throwException(
            self.RANGE_ERROR,
            `Cannot compare elements, since either element at index i:${i}=>${arr[i]} OR j:${j}=>${arr[j]} does not exist on this array`
          );
        }

        // do animation
        asyncCall(() => {
          highlightAndScope(algorithm.colors.compare);
          return algorithm.compare(this, i, j, res);
        });

        return res;
      }
    );

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "swap",
      function (i: number, j: number) {
        /// swap the data
        const arr = this.properties;

        // get real values;
        const a = arr[i];
        const b = arr[j];

        if (!a || !b) {
          self.throwException(
            self.RANGE_ERROR,
            `Cannot swap elements, since either element at index i:${i}=>${a} OR j:${j}=>${b} does not exist on this array`
          );
        }
        // swap
        arr[i] = b;
        arr[j] = a;

        // do animation by real values
        asyncCall(() => {
          highlightAndScope(algorithm.colors.swap);
          return algorithm.swap(this, i, j);
        });
      }
    );

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "splice",
      function (start: number, end: number) {
        const data = Array.prototype.splice.call(this.properties, start, end);
        const newObj = self.arrayNativeToPseudo(data);

        asyncCall(() => {
          highlightAndScope(algorithm.colors.splice);
          return algorithm.splice(newObj);
        });
        return newObj;
      }
    );

    self.setNativeFunctionPrototype(self.ARRAY, "shift", function () {
      // First animate, then apply shift to Array
      asyncCall(() => {
        highlightAndScope(algorithm.colors.shift);
        return algorithm.shift(this);
      });

      /// shift the element on the array AFTER, the animation..
      return Array.prototype.shift.call(this.properties);
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "push",
      function (...args: any[]) {
        const res = Array.prototype.push.apply(this.properties, args);

        asyncCall(() => {
          highlightAndScope(algorithm.colors.push);
          return algorithm.push(this);
        });
        return res;
      }
    );

    self.setNativeFunctionPrototype(self.ARRAY, "get", function (index: any) {
      asyncCall(() => {
        highlightAndScope(algorithm.colors.get);
        return algorithm.get(this, index);
      });

      return this.properties[index];
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "set",
      function (index: any, value: any) {
        this.properties[index] = value;

        asyncCall(() => {
          highlightAndScope(algorithm.colors.set);
          return algorithm.set(this, index, value);
        });
      }
    );

    // this concat function is copied straight from the interpreter itself
    const concat = function (thisArray: Interpreter.Object, args: any[]) {
      var data = [];
      var length = 0;
      // Start by copying the current array.
      var iLength = self.getProperty(thisArray, "length") as number;
      for (var i = 0; i < iLength; i++) {
        if (self.hasProperty(thisArray, i)) {
          var element = self.getProperty(thisArray, i);
          data[length] = element;
        }
        length++;
      }
      // Loop through all args and copy them in.
      for (var i = 0; i < args.length; i++) {
        var value = args[i];
        if (self.isa(value, self.ARRAY)) {
          var jLength = self.getProperty(value, "length") as number;
          for (var j = 0; j < jLength; j++) {
            if (self.hasProperty(value, j)) {
              data[length] = self.getProperty(value, j);
            }
            length++;
          }
        } else {
          data[length] = value;
        }
      }
      return data;
    };

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "concat",
      function (...args: any[]) {
        const data = concat(this, args);
        const newArray = self.arrayNativeToPseudo(data);

        asyncCall(() => {
          highlightAndScope(algorithm.colors.concat);
          return algorithm.concat(newArray);
        });

        return newArray;
      }
    );
  }

  /**
   * Function that returns an object as the local scope.
   * It filters everything out, that is in the global object
   * and leave only the difference
   */
  private getLocalScope(scope: any) {
    const globalKeys = Object.keys(this.interpreter.globalObject.properties);
    const keys = Object.keys(scope.object.properties);

    const difference = keys.filter(
      (x) => !globalKeys.includes(x) && x != "arguments"
    );

    const localScope: any = {};

    for (const k of difference) {
      const prop = scope.object.properties[k];

      if (prop instanceof Interpreter.Object) {
        localScope[k] = this.interpreter.pseudoToNative(prop);
      } else {
        localScope[k] = prop;
      }
    }

    return localScope;
  }

  /**
   * A function to handle the breakpoints
   */
  private handleBreakPoints(top: any) {
    const line = top.node.loc.start.line as number;
    const lineEnd = top.node.loc.end.line;

    const isBreakPoint = this.appState.isBreakPoint(line);

    if (isBreakPoint) {
      if (!this.lastBreakPoint.includes(line)) {
        this.lastBreakPoint.push(line);
        this.paused = true;
        this.appState.pause();
        console.log("breakpoint");

        /**
         * Defere the this.paused = false, since it will take some time,
         * untile appState.pause() will be updated.
         *
         * in the time, the executen loop could contine!
         */

        setTimeout(() => (this.paused = false), 50);
      }

      this.appState.setMarkedNode(top.node, "#ffaaaaaa");
    }

    if (line != lineEnd) {
      this.lastBreakPoint.pop();
    }
  }

  /**
   * This is the main execution loop, that steps through the tree.
   * It does basically the same, as the interpreter.run() method.
   */
  private async mainExecutingLoop() {
    while (!this.paused && this.appState.isRunning && this.interpreter.step()) {
      const state = this.interpreter.stateStack.getTop();
      this.handleBreakPoints(state);
      await this.analyseCurrentAstExpression(state);
      /** Add handlers that should run on each step as needed,to enhance interpreter */
    }

    /** Check if the interpreter is done with executing the user code */
    const state = this.interpreter.stateStack.getTop();
    if (this.initDone && state.done) {
      this.appState.setDone();
    } else {
      this.initDone = true;
    }
  }

  /**
   * When a new InterpreterWrapper should be created,
   * this dispose function must be called first, to clean up
   * this wrapper class!
   */
  dispose() {
    this.unsubscriber.forEach((unsub) => unsub());
  }

  /**
   * Analyses the current top expression of the stack
   */
  private async analyseCurrentAstExpression(state: any) {
    if (SemantikAnalysis.isCompareExpression(state)) {
      const scopeObjectProp = state.scope.object.properties;
      const left = state.node.left;
      const right = state.node.left;

      const leftValue = state.leftValue_;
      const rightValue = state.value;
      console.log("Highlight", leftValue, rightValue);

      if (left.object && right.object) {
        const leftObjName = left.object?.name;
        const rightObjName = right.object?.name;

        const leftObj = scopeObjectProp[leftObjName];
        const rightObj = scopeObjectProp[rightObjName];

        // mark code in editor
        this.appState.setMarkedNode(
          state.node,
          this.algorithm.colors.signal,
          true
        );
        // save local scope
        this.appState.setLocalScope(this.getLocalScope(state.scope), true);

        /// highlight current value of array
        this.algorithm.highlight(leftObj, leftValue);
        this.algorithm.highlight(rightObj, rightValue, "-=300");
        await this.algorithm.awaitAnimation();
        this.algorithm.unHighlight(leftObj, leftValue);
        this.algorithm.unHighlight(rightObj, rightValue, "-=300");
        await this.algorithm.awaitAnimation();
      }
    }
  }
}

class SemantikAnalysis {
  static compareOperators = ["<", "<=", ">", ">=", "==", "===", "!=", "!=="];

  static isCompareExpression(expression: any) {
    return (
      expression.node.type === "BinaryExpression" &&
      this.compareOperators.includes(expression.node.operator) &&
      // check if left evaluation is finshed
      expression.doneLeft_ &&
      // check if right evaluation is finshed
      expression.doneRight_
    );
  }
}
