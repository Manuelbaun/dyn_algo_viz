// import { speed, progress, state, event } from "./store";
import { derived, get, Writable, writable } from "svelte/store";
import type { CustomAcornNode, EVENTS, MarkedNode, STATE } from "./store_types";
import { writableModified } from "../utils/custom_store";
import { TimeSeries } from "../utils/time_series";

export class AppState {
  readonly progress = writable<number>(0);
  readonly currentTime = writable<number>(0);
  readonly speed = writable<number>(+(localStorage.getItem("speed") || 1));
  readonly event = writableModified<EVENTS>("INIT");
  readonly autofit = writable<boolean>(false);

  /**
   * State is derived from event, first event changes -> state will change
   */
  readonly state = derived<Writable<EVENTS>, STATE>(this.event, (ev) => {
    if (ev == "START") return "RUNNING";
    if (ev == "PAUSE") return "PAUSED";
    if (ev == "CONTINUE") return "RUNNING";
    if (ev == "RESET" || ev == "INIT") return "INIT";
    if (ev == "STEP") return "STEPPING";
    if (ev == "STEPIN") return "STEPPING";
    if (ev == "FINISH") return "DONE";
    return "ERROR";
  });

  readonly localScope = writable<object>({});
  readonly errors = writable<object>({});

  // need a helper class(Set), since breakPoints wont trigger
  private readonly breakPointsSet = new Set<number>();
  readonly breakPoints = writable<number[]>(
    JSON.parse(localStorage.getItem("breakPoints") || "[]") || []
  );

  readonly sourceCode = writable<string>(loadSourceCode());
  readonly markedNode = writable<MarkedNode>({
    node: undefined,
    color: "",
    autoScroll: false,
  });

  // for lookup the marked node,when slider range moves
  markedNodeSeries = new TimeSeries<MarkedNode>();
  localScopeSeries = new TimeSeries<object>();

  constructor() {
    // auto save speed to localstorage
    this.speed.subscribe((val) =>
      localStorage.setItem("speed", val.toString())
    );

    // auto save breakpoints
    this.breakPoints.subscribe((data) => {
      localStorage.setItem("breakPoints", JSON.stringify(data));
    });

    this.sourceCode.subscribe((data) => saveSourceCode(data));

    /// Listen to time Series change!
    this.currentTime.subscribe((ts) => {
      const node = this.markedNodeSeries.getAtTime(ts);
      this.markedNode.set(node);

      const localScope = this.localScopeSeries.getAtTime(ts);
      this.localScope.set(localScope);
    });
  }

  start() {
    this.event.set("START");
  }

  pause() {
    this.event.set("PAUSE");
  }

  continue() {
    this.event.set("CONTINUE");
  }

  reset() {
    this.event.set("RESET");
  }

  step() {
    this.event.set("STEP");
  }

  stepIn() {
    this.event.set("STEPIN");
  }

  setSpeed(value: number) {
    this.speed.set(value);
  }

  setProgress(value: number) {
    this.progress.set(value);
  }

  /// should only be set by the animation timeline!
  setCurrentTime(value: number) {
    this.currentTime.set(value);
  }

  setDone() {
    this.event.set("FINISH");
  }

  setError() {
    this.event.set("SOME_ERROR");
  }

  get autofitValue() {
    return get(this.autofit);
  }

  get currentTimeValue() {
    return get(this.currentTime);
  }
  get isRunning() {
    return get(this.state) == "RUNNING";
  }

  get breakPointsValues() {
    return Array.from(this.breakPointsSet);
  }

  get currentSourceCodeValue() {
    return get(this.sourceCode);
  }

  toggleBreakPoint(line: number) {
    if (this.breakPointsSet.has(line)) {
      this.breakPointsSet.delete(line);
    } else {
      this.breakPointsSet.add(line);
    }

    this.breakPoints.set(Array.from(this.breakPointsSet));
  }

  isBreakPoint(line: number) {
    return this.breakPointsSet.has(line);
  }

  setLocalScope(localScope: object, shouldSave = false) {
    this.localScope.set(localScope);

    // only store the localScope, when is running
    if (shouldSave) {
      this.localScopeSeries.add(this.currentTimeValue, localScope);
    }
  }

  setSourceCode(value: string) {
    this.sourceCode.set(value);
  }

  /**
   * Function, which highlights a line in the codemirror editor!
   * It will only store the nod node value, when the algorithm is running
   * during "debug", it will not store those valus...
   * @param node
   * @param color
   */
  markNode(
    node: CustomAcornNode | undefined,
    color: string,
    shouldSave = false
  ) {
    const old = get(this.markedNode);
    const markedNode = { ...old, node, color };

    if (shouldSave) {
      this.markedNodeSeries.add(appState.currentTimeValue, markedNode);
    }

    this.markedNode.set(markedNode);
  }
}

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

export const appState = new AppState();
