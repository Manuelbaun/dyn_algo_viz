import { derived, get, Writable, writable } from "svelte/store";
import type { CustomAcornNode, EVENTS, MarkedNode, STATE } from "./store_types";
import { writableModified } from "../utils/custom_store";
import { TimeSeries } from "../utils/time_series";
import { scaleLinear } from "d3";

function getItem(key: string, useJsonParser = true) {
  const item = localStorage.getItem(key);
  if (item) {
    if (useJsonParser) return JSON.parse(item);
    return item;
  }
}

function setItem(key: string, value: any) {
  let item: string = "";
  if (typeof value != "string") {
    item = JSON.stringify(value);
  } else {
    item = value;
  }

  localStorage.setItem(key, item);
}

export class AppState {
  private static instance: AppState;
  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }

    return AppState.instance;
  }

  constructor() {
    // auto save speed to localstorage
    this.animationSpeedSlider.subscribe((val) => setItem("speed", val));
    this.breakPoints.subscribe((data) => setItem("breakPoints", data));
    this.autofit.subscribe((data) => setItem("autofit", data));
    this.autoscroll.subscribe((data) => setItem("autoscroll", data));
    this.sourceCode.subscribe((data) => setItem("sourceCode", data));

    /// Listen to time Series change!
    this.currentTime.subscribe((ts) => {
      const node = this.markedNodeSeries.getAtTime(ts);
      this.markedNode.set(node);

      const localScope = this.localScopeSeries.getAtTime(ts);
      this.localScope.set(localScope);
    });
  }

  readonly progress = writable<number>(0);
  readonly currentTime = writable<number>(0);
  readonly duration = writable<number>(0);
  readonly event = writableModified<EVENTS>("init");

  /**
   * State is derived from event, first event changes -> state will change
   */
  readonly state = derived<Writable<EVENTS>, STATE>(this.event, (ev) => {
    if (ev == "start") return "RUNNING";
    if (ev == "pause") return "PAUSED";
    if (ev == "contine") return "RUNNING";
    if (ev == "reset" || ev == "init") return "INIT";
    if (ev == "step") return "STEPPING";
    if (ev == "stepin") return "STEPPING";
    if (ev == "finish") return "DONE";
    return "ERROR";
  });

  /**
   * A scale, which maps the domain from min, max/2 to values between 0.1 - 1.
   * This is used, so, that the middle of the input range slider is the animation speed 1
   */
  private leftScale = scaleLinear().domain([0.1, 5]).range([0.1, 1]);

  /** this handles the values from max/2 -max, in the range of 1-10*/
  private rightScale = scaleLinear().domain([5, 10]).range([1, 10]);

  readonly localScope = writable<object>({});
  readonly errors = writable<object>({});

  readonly animationSpeedSlider = writable<number>(+(getItem("speed") || 1));
  readonly animationSpeed = derived(this.animationSpeedSlider, (v) => {
    return v <= 5 ? this.leftScale(v) : this.rightScale(v);
  });

  readonly autofit = writable<boolean>(getItem("autofit") || false);
  readonly autoscroll = writable<boolean>(getItem("autoscroll") || false);

  // need a helper class(Set), since breakPoints wont trigger
  private readonly breakPointsSet = new Set<number>(
    getItem("breakPoints") || []
  );
  readonly breakPoints = writable<number[]>(getItem("breakPoints") || []);

  readonly sourceCode = writable<string>(loadSourceCode());
  readonly markedNode = writable<MarkedNode>({
    node: undefined,
    color: "",
  });

  // for lookup the marked node,when slider range moves
  private markedNodeSeries = new TimeSeries<MarkedNode>();
  private localScopeSeries = new TimeSeries<object>();

  start() {
    this.event.set("start");
  }

  pause() {
    this.event.set("pause");
  }

  continue() {
    this.event.set("contine");
  }

  /**
   * This method will reset the app state, 
   * and trigger all other components to reset
   */
  reset() {
    this.currentTime.set(0);
    this.progress.set(0);
    this.localScope.set({});
    this.duration.set(0);

    // overrides the timeseries for markednodes and localScope
    this.markedNodeSeries = new TimeSeries<MarkedNode>();
    this.localScopeSeries = new TimeSeries<object>();

    this.event.set("reset");
  }

  step() {
    this.event.set("step");
  }

  stepIn() {
    this.event.set("stepin");
  }

  setSpeed(value: number) {
    this.animationSpeedSlider.set(value);
  }

  setProgress(value: number) {
    this.progress.set(value);
  }

  /// should only be set by the animation timeline!
  setCurrentTime(value: number) {
    this.currentTime.set(value);
  }

  setDone() {
    this.event.set("finish");
  }

  setError() {
    this.event.set("some_error");
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

  get isInit() {
    return get(this.state) == "INIT";
  }

  get stateValue() {
    return get(this.state);
  }

  get breakPointsValues() {
    return Array.from(this.breakPointsSet);
  }

  get sourceCodeValue() {
    return get(this.sourceCode);
  }

  get autoscrollValue() {
    return get(this.autoscroll);
  }

  setOrUnsetBreakPoint(line: number) {
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

  setSourceCode(value: string) {
    this.sourceCode.set(value);
  }

  setLocalScope(localScope: object, shouldTrack = false) {
    this.localScope.set(localScope);

    // only store the localScope, when is running
    if (shouldTrack) {
      this.localScopeSeries.add(this.currentTimeValue, localScope);
    }
  }

  /**
   * Function, which highlights a line in the codemirror editor!
   * It will only store the nod node value, when the algorithm is running
   * during "debug", it will not store those valus...
   * @param node
   * @param color
   */
  setMarkedNode(
    node: CustomAcornNode | undefined,
    color: string,
    shouldTrack = false
  ) {
    const old = get(this.markedNode);
    const markedNode = { ...old, node, color };

    if (shouldTrack) {
      this.markedNodeSeries.add(this.currentTimeValue, markedNode);
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
