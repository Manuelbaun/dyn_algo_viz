import CodeMirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/lint/lint";
import "codemirror/addon/lint/javascript-lint";

import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/comment/comment";
import "codemirror/addon/fold/indent-fold";
import "codemirror/addon/fold/comment-fold";
import "codemirror/addon/hint/javascript-hint";

import type { MarkedNode } from "../../service/store_types";

// @ts-ignore : missing types?
import { JSHINT } from "jshint";
import { editorController } from "../../service/editor_controller";
import { interpreterController } from "../../service/interpreter_controller";
// @ts-ignore
// Extends the window object with JSHINT in order to work properly
window.JSHINT = JSHINT;

function makeMarker() {
  var marker = document.createElement("div");
  marker.style.color = `#ff1d1d`;
  marker.style.fontSize = "20px";
  marker.style.lineHeight = "20px";
  marker.innerHTML = "●";
  return marker;
}

export class CodeMirrorWrapper {
  editor: CodeMirror.EditorFromTextArea | undefined;
  marks: CodeMirror.TextMarker | undefined;
  textArea: HTMLTextAreaElement;

  constructor(textArea: HTMLTextAreaElement) {
    this.textArea = textArea;

    editorController.sourceCode.subscribe((value) => {
      // only set editor value, if the value changed
      if (this.editor && value != this.editor.getValue()) {
        this.editor.setValue(value);
      }
    });

    editorController.markedNode.subscribe((mark) => this.markNode(mark));

    this.editor = CodeMirror.fromTextArea(this.textArea, {
      gutters: ["CodeMirror-lint-markers", "breakpoints"],
      lineNumbers: true,
      lineWrapping: true,
      indentWithTabs: true,
      indentUnit: 2,
      tabSize: 2,
      smartIndent: true,
      mode: "javascript",
      lint: true,
      theme: "dracula",
    });

    // this.editor.setSize('100%', '100%');
    this.editor.setValue(editorController.getCurrentSourceCode());

    this.editor.on("change", (instance) => {
      // this.updateHints();
      editorController.setSourceCode(instance.getValue());
    });

    this.editor.on("gutterClick", function (cm, n) {
      const info = cm.lineInfo(n);
      const marker = info.gutterMarkers ? null : makeMarker();
      cm.setGutterMarker(n, "breakpoints", marker);
      interpreterController.toggleBreakPoint(info.line + 1);
    });

    // this.updateHints();
  }

  widgets: any[] = [];
  updateHints() {
    // if editor undefined
    if (!this.editor) return;
    const editor = this.editor;

    editor.operation(() => {
      for (var i = 0; i < this.widgets.length; ++i) {
        editor.removeLineWidget(this.widgets[i]);
      }
      // clear
      this.widgets.length = 0;

      JSHINT(editor.getValue());
      for (var i = 0; i < JSHINT.errors.length; ++i) {
        var err = JSHINT.errors[i];
        if (!err) continue;
        var msg = document.createElement("div");
        var icon = msg.appendChild(document.createElement("span"));

        icon.innerHTML = "!!";
        icon.className = "lint-error-icon";
        msg.appendChild(document.createTextNode(err.reason));
        msg.className = "lint-error";

        const widget = editor.addLineWidget(err.line - 1, msg, {
          coverGutter: false,
          noHScroll: true,
        });

        this.widgets.push(widget);
      }
    });
    var info = editor.getScrollInfo();

    var after = editor.charCoords(
      { line: editor.getCursor().line + 1, ch: 0 },
      "local"
    ).top;

    if (info.top + info.clientHeight < after) {
      editor.scrollTo(null, after - info.clientHeight + 3);
    }
  }

  markNode(markedNode: MarkedNode) {
    if (!this.editor || !markedNode) return;

    const { node, color, autoScroll } = markedNode;

    this.marks?.clear();

    if (!node) {
      return;
    }

    const { loc } = node;

    const startPos = {
      line: loc.start.line - 1,
      ch: loc.start.column,
    } as CodeMirror.Position;

    const endPos = {
      line: loc.end.line - 1,
      ch: loc.end.column,
    } as CodeMirror.Position;

    this.marks = this.editor.markText(startPos, endPos, {
      css: "background-color:" + color,
    });

    /// Disable here, if no scroll should happen
    if (autoScroll) {
      this.editor.scrollIntoView(startPos, 200);
    }
  }
}
