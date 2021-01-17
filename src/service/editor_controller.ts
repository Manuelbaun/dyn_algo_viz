import { get, writable } from "svelte/store";
import type { CustomAcornNode } from "./store_types";

function loadSourceCode(): string {
  return (
    localStorage.getItem("sourceCode") ||
    `
  function bubbleSort(array) {
    var len = array.length;
  
    for (var i = 0; i < len; i++) {
      for (var j = 0; j < len - i - 1; j++) {
          if (array.compare(j, j + 1)) {
            array.swap(j, j + 1);
        }
      }
    }
    return array;
  }
  bubbleSort(root);
  `
  );
}

function saveSourceCode(value: string) {
  localStorage.setItem("sourceCode", value);
}

type MarkedNode = {
  node: CustomAcornNode | undefined;
  color: string;
  autoScroll: boolean;
};

export class EditorController {
  readonly sourceCode = writable<string>(loadSourceCode());
  readonly markedNode = writable<MarkedNode>({
    node: undefined,
    color: "",
    autoScroll: false,
  });

  constructor() {
    this.sourceCode.subscribe((data) => saveSourceCode(data));
  }

  getCurrentSourceCode() {
    return get(this.sourceCode);
  }

  setSourceCode(value: string) {
    this.sourceCode.set(value);
  }

  markNode(node: CustomAcornNode | undefined, color: string) {
    const old = get(this.markedNode);
    this.markedNode.set({ ...old, node, color });
  }
}

export const editorController = new EditorController();
