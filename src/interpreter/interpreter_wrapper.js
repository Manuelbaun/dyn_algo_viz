import Interpreter from "./interpreter";

import ComparisonSorts from "../algorithms/comparison";
import { appState } from "../service/app_state";

export class InterpreterWrapper {
  /**
   * @param {ComparisonSorts} algorithm
   */
  constructor(algorithm) {
    this.algorithm = algorithm;

    // should be from app state!
    this.paused = false;
    this.initDone = false;

    const initFunction = this.initFunctions.bind(this);
    /**
     *
     */
    this.interpreter = new Interpreter("", initFunction);

    this.stateSubscription = appState.state.subscribe((state) => {
      if (state == "RUNNING") {
        this.mainExecutingLoop();
      }

      if (state == "DONE") {
        console.log("done");
      }
    });

    this.eventSubscription = appState.event.subscribe(async (event) => {
      if (event == "START") {
        await algorithm.setupDone;
        this.start();
      }

      this.handleStepAndStepIn(event);
    });
  }

  /**
   * Function that returns an object as the local scope.
   * It filters verything, that is in the globalobject
   * and leave only the difference
   * @param {*} scope
   */
  getLocalScope(scope) {
    const globalKeys = Object.keys(this.interpreter.globalObject.properties);
    const keys = Object.keys(scope.object.properties);

    const difference = keys.filter(
      (x) => !globalKeys.includes(x) && x != "arguments"
    );

    const localScope = {};

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
   * @private
   * @param {Interpreter} self
   * @param {Interpreter.Object} globalObject
   */
  initFunctions(self, globalObject) {
    // extra variable for algorithm, since the context within the wrapper is a different one!
    // and this.algorithm wont be available within the wrapper functions
    const algorithm = this.algorithm;
    /**
     * A utility function to stop the interpreter running and await async functions, then continue
     * when the interpreter was in runnning state!
     * It is expected, that the func returns a promise, or multiple Promises
     * @param {() => Promise<any>) | () => Promise<any>[]} func
     * @private
     */
    const asyncCall = async (func) => {
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
      if (appState.isRunning || paused == false) {
        this.mainExecutingLoop();
      }
    };

    /**
     * Function to highlight the code line
     * and store local Scope at that node/state
     * @param {string} color
     */
    const highlightAndScope = (color) => {
      const state = self.stateStack.getTop();
      appState.markNode(state.node, color, true);
      appState.setLocalScope(this.getLocalScope(state.scope), true);
    };

    /** **************** **/
    /** Define Props     **/
    /** **************** **/
    const root = self.nativeToPseudo(algorithm.data);
    root.id = "root";
    self.setProperty(globalObject, "root", root);

    /** **************** **/
    /** Define functions **/
    /** **************** **/
    self.setProperty(
      globalObject,
      "print",
      self.createNativeFunction(function (...obj) {
        const node = self.stateStack.getTop().node;
        const printLine = "print:" + node.loc.start.line;
        try {
          if (obj instanceof Array) {
            const res = obj.map((e) => self.pseudoToNative(e));

            console.log(printLine, ...res);
          } else {
            const res = self.pseudoToNative(obj);
            console.log(printLine, res);
          }
        } catch (e) {
          console.log(e);
          console.log(printLine, obj);
        }
      }, false)
    );

    /** *************************************** **/
    /** Define/Override Array prototype methods **/
    /** *************************************** **/

    /// extends the array prototype of the interpreter! with a compare function
    self.setNativeFunctionPrototype(self.ARRAY, "compare", function (i, j) {
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
    });

    self.setNativeFunctionPrototype(self.ARRAY, "swap", function (i, j) {
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
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "splice",
      function (start, end) {
        const data = Array.prototype.splice.call(this.properties, start, end);
        const newObj = self.arrayNativeToPseudo(data);

        asyncCall(() => {
          highlightAndScope(algorithm.colors.splice);
          return algorithm.splice(newObj);
        });
        return newObj;
      }
    );

    self.setNativeFunctionPrototype(self.ARRAY, "shift", function (args) {
      // First animate, then apply shift to Array
      asyncCall(() => {
        highlightAndScope(algorithm.colors.shift);
        return algorithm.shift(this);
      });

      /// shift the element on the array AFTER, the animation..
      return Array.prototype.shift.call(this.properties);
    });

    self.setNativeFunctionPrototype(self.ARRAY, "push", function (args) {
      const res = Array.prototype.push.apply(this.properties, arguments);

      asyncCall(() => {
        highlightAndScope(algorithm.colors.push);
        return algorithm.push(this);
      });
      return res;
    });

    self.setNativeFunctionPrototype(self.ARRAY, "get", function (index) {
      asyncCall(() => {
        highlightAndScope(algorithm.colors.get);
        return algorithm.get(this, index);
      });

      return this.properties[index];
    });

    self.setNativeFunctionPrototype(self.ARRAY, "set", function (index, value) {
      this.properties[index] = value;

      asyncCall(() => {
        highlightAndScope(algorithm.colors.set);
        return algorithm.set(this, index, value);
      });
    });

    // this concat function is copied straight from the interpreter itself
    const concat = function (thisArray, args) {
      var data = [];
      var length = 0;
      // Start by copying the current array.
      var iLength = self.getProperty(thisArray, "length");
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
          var jLength = self.getProperty(value, "length");
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

    self.setNativeFunctionPrototype(self.ARRAY, "concat", function (args) {
      const data = concat(this, arguments);
      const newArray = self.arrayNativeToPseudo(data);

      asyncCall(() => {
        highlightAndScope(algorithm.colors.concat);
        return algorithm.concat(newArray);
      });

      return newArray;
    });
  }

  /**
   * A function to handle the breakpoints
   */
  lastBreakPoint = [];
  handleBreakPoints(top) {
    const line = top.node.loc.start.line;
    const lineEnd = top.node.loc.end.line;

    const isBreakPoint = appState.isBreakPoint(line);

    if (isBreakPoint) {
      if (!this.lastBreakPoint.includes(line)) {
        this.lastBreakPoint.push(line);
        this.paused = true;
        appState.pause();

        /**
         * Defere the this.paused = false, since it will take some time,
         * untile appState.pause() will be updated.
         *
         * in the time, the executen loop could contine!
         */

        setTimeout(() => (this.paused = false), 50);
      }

      appState.markNode(top.node, "#ffaaaaaa");
    }

    if (line != lineEnd) {
      this.lastBreakPoint.pop();
    }
  }

  handleStepAndStepIn(event) {
    if (event == "STEPIN" || event == "STEP") {
      const state = this.interpreter.stateStack.getTop();

      if (event == "STEP") {
        // // walks only editor line by editor line
        // const startLine = node.loc.start.line;
        // appState.toggleBreakPointsToIgnore(startLine);
        // console.log("StartLine:", startLine);
        // const paused = interpreter.paused_;
        // interpreter.paused_ = false;
        // while (!interpreter.paused_ && interpreter.step()) {
        //   const state = interpreter.stateStack.getTop();
        //   const node = state.node;
        //   const line = node.loc.start.line;
        //   const lineEnd = node.loc.end.line;
        //   if (startLine != line && line == lineEnd) {
        //     console.log("exitline", line, line == lineEnd);
        //     break;
        //   }
        // }
        // appState.toggleBreakPointsToIgnore(startLine);
        // interpreter.paused_ = paused;
        // appState.markNode(node, "#ffaafa");
        // processLocalScope(state.scope);
      } else {
        // will walk every node in the tree
        this.stepHighlighted(state);
      }
    }
  }

  stepHighlighted(state) {
    // will walk every node in the tree
    const paused = this.paused;
    this.paused = false;
    const res = this.interpreter.step();
    this.paused = paused;

    appState.markNode(state.node, "#ffaafa");
    appState.setLocalScope(this.getLocalScope(state.scope));
  }

  /**
   *
   * This is the main execution loop, that steps through the tree.
   * It does basically the same, as the interpreter.run() method.
   *
   * @private
   */
  mainExecutingLoop() {
    while (appState.isRunning && !this.paused && this.interpreter.step()) {
      const topStack = this.interpreter.stateStack.getTop();
      this.handleBreakPoints(topStack);

      /** Add handlers that should run on each step as needed,to enhance interpreter */
    }

    /** Check if the interpreter is done with executing the user code */
    const state = this.interpreter.stateStack.getTop();
    if (this.initDone && state.done) {
      appState.setDone();
    } else {
      this.initDone = true;
    }
  }

  /** Start Method, executre only once */
  started = false;
  start() {
    if (!this.started) {
      this.started = true;
      this.interpreter.appendCode(appState.sourceCodeValue);

      this.mainExecutingLoop();
    } else {
      console.error("Cannot start the interpreter again!");
    }
  }

  /**
   * When a new InterpreterWrapper should be created,
   * this dispose function must be called first, to clean up
   * this wrapper class!
   */
  dispose() {
    this.stateSubscription();
    this.eventSubscription();
  }
}
