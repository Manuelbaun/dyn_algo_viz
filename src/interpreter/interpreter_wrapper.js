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

    this.interpreter = new Interpreter(
      "",
      this.createInterpreterInitFunctions()
    );

    appState.state.subscribe((state) => {
      if (state == "RUNNING") {
        this.executingStepLoop();
      }

      if (state == "DONE") {
        console.log("done");
      }
    });

    appState.event.subscribe(async (event) => {
      if (event == "START") {
        await algorithm.setupDone;
        this.execute();
      }

      this.handleStepAndStepIn(event);
    });
  }

  /**
   * @private
   */
  createInterpreterInitFunctions() {
    const algorithm = this.algorithm;

    /**
     * A utility function to stop the interpreter running and await async functions, then continue
     * when the interpreter was in runnning state!
     * @param {*} func
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

      if (appState.isRunning || paused == false) {
        this.executingStepLoop();
      }
    };

    /**
     * @param {Interpreter} self
     * @param {Interpreter.Object} globalObject
     */
    const initFunctions = function (self, globalObject) {
      const globalKeys = Object.keys(globalObject.properties);

      /**
       * Function that returns an object as the local scope.
       * It filters verything, that is in the globalobject
       * and leave only the difference
       * @param {*} scope
       */
      function getLocalScope(scope) {
        const keys = Object.keys(scope.object.properties);

        const difference = keys.filter(
          (x) => !globalKeys.includes(x) && x != "arguments"
        );

        const localScope = {};

        for (const k of difference) {
          const prop = scope.object.properties[k];

          if (prop instanceof Interpreter.Object) {
            localScope[k] = self.pseudoToNative(prop);
          } else {
            localScope[k] = prop;
          }
        }

        return localScope;
      }
      /**
       * Function to highlight the code line
       * and store local Scope at that node/state
       * @param {string} color
       */
      const highlightAndScope = (color) => {
        const state = self.stateStack.getTop();
        appState.markNode(state.node, color, true);
        appState.setLocalScope(getLocalScope(state.scope), true);
      };

      /** **************** */
      /** Define Props     */
      /** **************** */
      const root = self.nativeToPseudo(algorithm.data);
      root.id = "root";
      self.setProperty(globalObject, "root", root);

      //  print
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

      /** **************** */
      /** Define functions */
      /** **************** */

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
        console.log("Start animate");
        // do animation
        asyncCall(() => {
          highlightAndScope(algorithm.colors.compare);
          return algorithm.compare(this, i, j, res);
        });

        console.log("End animate");

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

        const element = this.properties[index];
        return element;
      });

      self.setNativeFunctionPrototype(
        self.ARRAY,
        "set",
        function (index, value) {
          this.properties[index] = value;

          asyncCall(() => {
            highlightAndScope(algorithm.colors.set);
            return algorithm.set(this, index, value);
          });
        }
      );

      // copied from the interpreterclass
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
    };

    return initFunctions;
  }

  lastBreakPoint = [];
  handleBreakPoints(top) {
    const line = top.node.loc.start.line;
    const lineEnd = top.node.loc.end.line;

    const isBreakPoint = appState.isBreakPoint(line);

    if (isBreakPoint) {
      if (!this.lastBreakPoint.includes(line)) {
        this.lastBreakPoint.push(line);
        interpreter.setPause();
        appState.pause();
        // deffer unset => otherwise the interpreter will not pause since other functions
        // will trigge continue
        setTimeout(() => {
          interpreter.unsetPause();
        }, 50);
      }

      appState.markNode(top.node, "#ffaaaaaa");
    }

    if (line != lineEnd) {
      this.lastBreakPoint.pop();
    }
  }

  handleStepAndStepIn(event) {
    if (event == "STEPIN" || event == "STEP") {
      const state = interpreter.stateStack.getTop();

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
        const paused = interpreter.paused_;
        interpreter.paused_ = false;
        const res = interpreter.step();
        interpreter.paused_ = paused;

        appState.markNode(state.node, "#ffaafa");
        appState.setLocalScope(interpreter.getLocalScope(state.scope));
      }
    }
  }

  /**
   * @private
   * If loop was left, it needs to be entered again!
   */
  executingStepLoop() {
    console.log("Start exe loop");
    while (appState.isRunning && !this.paused && this.interpreter.step()) {
      const topStack = this.interpreter.stateStack.getTop();
      console.log("step");
      this.handleBreakPoints(topStack);
    }

    console.log("leave while loop");

    const state = this.interpreter.stateStack.getTop();

    // Done can only happen
    if (this.firstInit && state.done) {
      console.log("why done now?", state);
      appState.setDone();
    } else {
      this.firstInit = true;
    }
  }

  execute() {
    const code = appState.sourceCodeValue;
    this.interpreter.appendCode(code);
    this.firstInit = false;
    this.executingStepLoop();
  }

  dispose() {
    // algorithm.dispose();
  }
}
