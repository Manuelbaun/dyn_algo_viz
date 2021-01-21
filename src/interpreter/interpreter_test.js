import Interpreter from "./interpreter";
import ComparisonSorts from "../algorithms/comparison";

import { appController } from "../service/app_controller";

import { editorController } from "../service/editor_controller";
import { interpreterController } from "../service/interpreter_controller";

export async function testAlgo(svgjs) {
  const algorithm = new ComparisonSorts(svgjs);
  await algorithm.setup();

  /**
   * @param {Interpreter} self
   * @param {Interpreter.Object} globalObject
   */
  const interpreterInitFunctions = function (self, globalObject) {
    /** **************** */
    /** Define Props     */
    /** **************** */
    const root = self.nativeToPseudo(algorithm.data);

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
      const node = self.stateStack.getTop().node;
      editorController.markNode(node, "#aaafff");

      // do animation
      const arr = this.properties;
      const res = arr[i] > arr[j];

      if (res == null) {
        self.throwException(
          self.RANGE_ERROR,
          `Cannot compare elements, since either element at index i:${i}=>${arr[i]} OR j:${j}=>${arr[j]} does not exist on this array`
        );
      }

      // do animation
      self.asyncCall(() => algorithm.compare(this, i, j, res));

      return res;
    });

    self.setNativeFunctionPrototype(self.ARRAY, "swap", function (i, j) {
      const node = self.stateStack.getTop().node;
      editorController.markNode(node, "#cccccc");

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
      self.asyncCall(() => algorithm.swap(this, i, j));
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "splice",
      function (start, end) {
        editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

        const data = Array.prototype.splice.call(this.properties, start, end);
        const newObj = self.arrayNativeToPseudo(data);

        self.asyncCall(() => algorithm.splice(newObj));
        return newObj;
      }
    );

    self.setNativeFunctionPrototype(self.ARRAY, "shift", function (args) {
      editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

      self.asyncCall(() => algorithm.shift(this));
      return Array.prototype.shift.call(this.properties);
    });

    self.setNativeFunctionPrototype(self.ARRAY, "push", function (args) {
      editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

      const res = Array.prototype.push.apply(this.properties, arguments);

      self.asyncCall(() => algorithm.push(this));
      return res;
    });

    self.setNativeFunctionPrototype(self.ARRAY, "get", function (args) {
      editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

      const element = this.properties[index];
      return element;
    });

    self.setNativeFunctionPrototype(
      self.ARRAY,
      "set",
      function (index, element) {
        editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");
        this.properties[index] = element;
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
      editorController.markNode(self.stateStack.getTop().node, "#f1f1f1f1");

      const data = concat(this, arguments);
      const newArray = self.arrayNativeToPseudo(data);

      self.asyncCall(() => algorithm.concat(newArray));
      return newArray;
    });
  };

  const run = () => {
    const code = editorController.getCurrentSourceCode();

    const interpreter = new Interpreter(code, interpreterInitFunctions);

    const globalKeys = Object.keys(interpreter.globalObject.properties);
    const processLocalScope = (scope) => {
      const keys = Object.keys(scope.object.properties);

      const difference = keys.filter(
        (x) => !globalKeys.includes(x) && x != "arguments"
      );

      const obj = {};

      for (const k of difference) {
        const prop = scope.object.properties[k];

        if (prop instanceof Interpreter.Object) {
          obj[k] = interpreter.pseudoToNative(prop);
        } else {
          obj[k] = prop;
        }
      }

      interpreterController.setLocalScope(obj);
    };

    appController.state.subscribe((state) => {
      if (state == "RUNNING") {
        interpreter.run();
      }

      if (state == "DONE") {
        /// TODO: needs to be called
        console.log("done");
      }
    });

    function handleStepAndStepIn(event) {
      if (event == "STEPIN" || event == "STEP") {
        const state = interpreter.stateStack.getTop();
        const node = state.node;

        if (event == "STEP") {
          // // walks only editor line by editor line
          // const startLine = node.loc.start.line;
          // interpreterController.toggleBreakPointsToIgnore(startLine);
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
          // interpreterController.toggleBreakPointsToIgnore(startLine);
          // interpreter.paused_ = paused;
          // editorController.markNode(node, "#ffaafa");
          // processLocalScope(state.scope);
        } else {
          // will walk every node in the tree
          const paused = interpreter.paused_;
          interpreter.paused_ = false;
          const res = interpreter.step();
          interpreter.paused_ = paused;

          editorController.markNode(node, "#ffaafa");
          processLocalScope(state.scope);
        }
      }
    }

    let lastBreakPoint = [];
    function handleBreakPoints(top) {
      const line = top.node.loc.start.line;
      const lineEnd = top.node.loc.end.line;

      const isBreakPoint = interpreterController.isBreakPoint(line);

      if (isBreakPoint) {
        if (!lastBreakPoint.includes(line)) {
          lastBreakPoint.push(line);
          interpreter.setPause();
          appController.pause();
          // deffer unset => otherwise the interpreter will not pause since other functions
          // will trigge continue
          setTimeout(() => {
            interpreter.unsetPause();
          }, 50);
        }

        editorController.markNode(top.node, "#ffaaaaaa");
      }

      if (line != lineEnd) {
        lastBreakPoint.pop();
      }
    }

    appController.event.subscribe((event) => handleStepAndStepIn(event));
    interpreter.onStep = handleBreakPoints;

    return () => {
      algorithm.dispose();
      // TODO: proper cleanup
    };
  };

  // return a cleanup function
  return run;
}
