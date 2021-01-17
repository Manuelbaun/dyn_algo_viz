// import { speed, progress, state, event } from "./store";
import { derived, get, Writable, writable } from "svelte/store";
import { writableModified } from "../utils/danger_store";
import type { EVENTS, STATE } from "./store_types";

export class AppController {
  progress = writable<number>(0);
  speed = writable<number>(+(localStorage.getItem("speed") || 1));
  event = writableModified<EVENTS>("INIT");

  // crash!!
  state = derived<Writable<EVENTS>, STATE>(this.event, (ev) => {
    if (ev == "START") return "RUNNING";
    if (ev == "PAUSE") return "PAUSED";
    if (ev == "CONTINUE") return "RUNNING";
    if (ev == "RESET" || ev == "INIT") return "INIT";
    if (ev == "STEP") return "STEPPING";
    if (ev == "STEPIN") return "STEPPING";
    if (ev == "FINISH") return "DONE";
    return "ERROR";
  });

  constructor() {
    this.state.subscribe((val) => {
      console.log("state:", val);
    });

    this.event.subscribe((val) => {
      console.log("event:", val);
    });

    this.speed.subscribe((val) =>
      localStorage.setItem("speed", val.toString())
    );
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

  setDone() {
    this.event.set("FINISH");
  }

  setError() {
    this.event.set("SOME_ERROR");
  }

  get isRunning() {
    return get(this.state) == "RUNNING";
  }
}

export const appController = new AppController();
