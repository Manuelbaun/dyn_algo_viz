import { get, writable } from "svelte/store";
import type { CustomAcornNode, MarkedNode } from "./store_types";
import { TimeSeries } from "../utils/time_series";
import { appController } from "./app_controller";

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

export class EditorController {
  readonly sourceCode = writable<string>(loadSourceCode());
  readonly markedNode = writable<MarkedNode>({
    node: undefined,
    color: "",
    autoScroll: false,
  });

  // for lookup the marked node,when slider range moves
  series = new TimeSeries<MarkedNode>();

  constructor() {
    this.sourceCode.subscribe((data) => saveSourceCode(data));

    /// Listen to time Series change!
    appController.currentTime.subscribe((ts) => {
      if (!appController.isRunning) {
        const node = this.series.getAtTime(ts);
        this.markedNode.set(node);
      }
    });
  }

  getCurrentSourceCode() {
    return get(this.sourceCode);
  }

  setSourceCode(value: string) {
    this.sourceCode.set(value);
  }

  markNode(node: CustomAcornNode | undefined, color: string) {
    const old = get(this.markedNode);
    const markedNode = { ...old, node, color };

    this.series.add(appController.getCurrentTime(), markedNode);

    this.markedNode.set(markedNode);
  }
}

export const editorController = new EditorController();
