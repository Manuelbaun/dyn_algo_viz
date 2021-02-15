import Interpreter from "./interpreter";

import type { AppState } from "../service/app_state";
import type { EVENTS } from "../service/store_types";
import type ComparisonSortsVisualizer from "../algorithm_viz/comparison_sort_visualizer";

export class InterpreterWrapper {
  private algorithm: ComparisonSortsVisualizer;
  private paused: boolean;
  private interpreter: Interpreter;
  private appState: AppState;

  private lastBreakPoint: number[] = [];
  private unsubscriber: Function[] = [];

  constructor(appState: AppState, algorithm: ComparisonSortsVisualizer) {
    this.appState = appState;
    this.algorithm = algorithm;

    // should be from app state!
    this.paused = false;

    // make sure, that `this` within the functions is references the
    // InterpreterWrapper class and not
    this.asyncCall = this.asyncCall.bind(this);
    this.handleEvents = this.handleEvents.bind(this);
    this.highlightAndSetLocalScope = this.highlightAndSetLocalScope.bind(this);
    this.interpreterInitFunctions = this.interpreterInitFunctions.bind(this);

    // setup the interpreter, but add user code, only when start button is pressed
    // see start method.
    this.interpreter = new Interpreter("", this.interpreterInitFunctions);

    // listen to events
    this.unsubscriber.push(appState.event.subscribe(this.handleEvents));
  }

  private handleEvents(event: EVENTS) {
    if ("start" === event) {
      this.interpreter.appendCode(this.appState.sourceCodeValue);
      this.mainExecutingLoop();
    } else if ("pause" === event || "reset" === event) {
      this.paused = true;
    } else if ("continue" === event) {
      this.paused = false;
      this.mainExecutingLoop();
    } else if ("step" === event) {
      this.executeInterpreterStep();
      this.highlightAndSetLocalScope("#ffaafa", false);
    }
  }

  /**
   * A utility function to stop the interpreter running and await async functions, then continue
   * when the interpreter was in running state!
   * It is expected, that the func returns a promise, or Array of Promises
   */
  asyncCallStack: Promise<any>[] = [];
  private async asyncCall(func: () => Promise<any>) {
    const paused = this.paused;
    this.paused = true;

    this.asyncCallStack.push(func());
    console.log("Async Call", func);

    // must await all promises in that stack
    await Promise.all(this.asyncCallStack);
    this.paused = paused;

    /**
     * If interpreter was in running mode, => continue to execute
     * This needs to be done, since, this function could also be called,
     * when the stepping mode is active
     */
    if (this.appState.isRunning && paused === false) {
      this.mainExecutingLoop();
    }
  }

  /**
   * Function to highlight the code line
   * and store local Scope at that node/state
   * @param {string} color
   */
  private highlightAndSetLocalScope(color: string, shouldTrack = true) {
    const state = this.interpreter.stateStack.getTop();
    this.appState.setMarkedNode(state.node, color, shouldTrack);
    this.appState.setLocalScope(this.getLocalScope(state.scope), shouldTrack);
  }

  private interpreterInitFunctions(
    self: Interpreter,
    globalObject: Interpreter.Object
  ) {
    // extra variable for algorithm, since the context within the wrapper is a different one!
    // and this.algorithm wont be available within the wrapper functions
    const algorithm = this.algorithm;

    // make locally available, because using `this` within the interpreter wrapper functions
    // would not work, because of the scope of the used arrays
    const asyncCall = this.asyncCall;
    const highlightAndScope = this.highlightAndSetLocalScope;
    /** **************** **/
    /** Define Props     **/
    /** **************** **/
    const root = self.nativeToPseudo(algorithm.data);

    // should always exist =>extends with id
    if (root) {
      (root as any).id = "root";
    } else {
      throw Error(
        "Cannot create the  initial value 'root'-array for the interpreter!"
      );
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
        highlightAndScope(algorithm.colors.compare);
        asyncCall(() => algorithm.visualizeCompare(this, i, j, res));

        return res;
      }
    );

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "swap",
      function (i: number, j: number) {
        const props = this.properties;

        if (props.length < Math.max(i, j)) {
          self.throwException(
            self.RANGE_ERROR,
            `Accessed Index ${Math.max(
              i,
              j
            )} is out of bounce of used array with a length of ${props.length}`
          );
        }
        // swap
        const a = props[i];
        props[i] = props[j];
        props[j] = a;

        // do animation by real values
        highlightAndScope(algorithm.colors.swap);
        asyncCall(() => algorithm.visualizeSwap(this, i, j));
      }
    );

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "splice",
      function (start: number, end: number) {
        const data = Array.prototype.splice.call(this.properties, start, end);
        const newObj = self.arrayNativeToPseudo(data);

        highlightAndScope(algorithm.colors.splice);
        asyncCall(() => algorithm.visualizeSplice(newObj));
        return newObj;
      }
    );

    self.setNativeFunctionPrototype(self.ARRAY, "shift", function () {
      // First animate, then apply shift to Array
      highlightAndScope(algorithm.colors.shift);
      asyncCall(() => algorithm.visualizeShift(this));

      /// shift the element on the array AFTER, the animation..
      return Array.prototype.shift.call(this.properties);
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "push",
      function (...args: any[]) {
        const res = Array.prototype.push.apply(this.properties, args);

        highlightAndScope(algorithm.colors.push);
        asyncCall(() => algorithm.visualizePush(this));
        return res;
      }
    );

    self.setNativeFunctionPrototype(self.ARRAY, "get", function (index: any) {
      highlightAndScope(algorithm.colors.get);
      asyncCall(() => algorithm.visualizeGet(this, index));

      return this.properties[index];
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "set",
      function (index: any, value: any) {
        this.properties[index] = value;

        highlightAndScope(algorithm.colors.set);
        asyncCall(() => algorithm.visualizeSet(this, index, value));
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

        highlightAndScope(algorithm.colors.concat);
        asyncCall(() => algorithm.visualizeConcat(newArray));

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
  private handleBreakPoints(currentState: any) {
    const line = currentState.node.loc.start.line as number;
    const lineEnd = currentState.node.loc.end.line;

    const isBreakPoint = this.appState.isBreakPoint(line);

    if (isBreakPoint) {
      if (!this.lastBreakPoint.includes(line)) {
        this.lastBreakPoint.push(line);
        this.paused = true;
        this.appState.pause();

        /**
         * Defer the this.paused = false, since it will take some time,
         * until appState.pause() will be updated.
         * in the time, the mainExecutionLoop could continue!
         */
        setTimeout(() => {
          this.paused = false;
        }, 50);
      }

      this.appState.setMarkedNode(currentState.node, "#ffaaaaaa");
    }

    if (line != lineEnd) {
      this.lastBreakPoint.pop();
    }
  }

  private executeInterpreterStep() {
    const executed = this.interpreter.step();
    const state = this.interpreter.stateStack.getTop();
    this.handleBreakPoints(state);
    this.analyseCurrentStateExpression(state);
    /** Add step handlers as needed **/

    return executed;
  }

  /**
   * This is the main execution loop, that steps through the tree.
   * It does basically the same, as the interpreter.run() method.
   */

  private async mainExecutingLoop() {
    /// VERY VERY Importent!!: here await to all asyncCalls used by this.asyncCall method
    /// otherwise animation gets not finished before another animation starts.
    /// this is due the async nature
    await Promise.all(this.asyncCallStack);
    this.asyncCallStack = [];

    var stackCounter = 0;
    let executed = true;
    while (!this.paused && this.appState.isRunning && executed) {
      executed = this.executeInterpreterStep();
      stackCounter++;

      if (stackCounter > 2000 || this.interpreter.stateStack.length > 100) {
        throw Error(
          "Maximum Loop iteration exceeded!: Counter :" +
            stackCounter +
            " stackLength: " +
            this.interpreter.stateStack.length
        );
      }
    }

    /** Check if the interpreter is done with executing the user code */
    const state = this.interpreter.stateStack.getTop();
    if (state.done) {
      this.appState.setDone();
    }
  }

  /**
   * When a new InterpreterWrapper should be created,
   * this dispose function must be called first, to clean up
   * this wrapper class!
   */
  dispose() {
    this.unsubscriber.forEach((unsub) => unsub());
    console.log("Dispose interpreter Wrapper");
  }

  /**
   * Analyses the current top expression of the stack
   */
  private analyseCurrentStateExpression(currentState: any) {
    if (SemantikAnalysis.isCompareExpression(currentState)) {
      const scopeObjectProp = currentState.scope.object.properties;
      const left = currentState.node.left;
      const right = currentState.node.left;

      const leftValue = currentState.leftValue_;
      const rightValue = currentState.value;

      if (left.object && right.object) {
        const leftObjName = left.object?.name;
        const rightObjName = right.object?.name;

        const leftObj = scopeObjectProp[leftObjName];
        const rightObj = scopeObjectProp[rightObjName];

        this.highlightAndSetLocalScope(this.algorithm.colors.signal, true);

        this.asyncCall(async () => {
          /// highlight current value of array
          this.algorithm.visualizeHighlight(leftObj, leftValue);
          this.algorithm.visualizeHighlight(rightObj, rightValue, "-=300");
          await this.algorithm.awaitAnimation();
          this.algorithm.visualizeUnHighlight(leftObj, leftValue);
          this.algorithm.visualizeUnHighlight(rightObj, rightValue, "-=300");
          await this.algorithm.awaitAnimation();
        });
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
