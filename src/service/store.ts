import { derived, Writable, writable } from "svelte/store";
import type { MarkedNode, STATE, EVENTS } from "./store_types";
import { writableModified } from "../utils/danger_store";

// export const progress = writable<number>(0);
// export const speed = writable<number>(1);
// export const event = writableModified<EVENTS>("INIT");

// // STATE derives from EVENTS!
// export const state = derived<Writable<EVENTS>, STATE>(event, ($val) => {
//   if ($val == "START") return "RUNNING";
//   if ($val == "PAUSE") return "PAUSED";
//   if ($val == "CONTINUE") return "RUNNING";
//   if ($val == "RESET" || $val == "INIT") return "INIT";
//   if ($val == "STEP") return "STEPPING";
//   if ($val == "STEPIN") return "STEPPING";
//   return "ERROR";
// });

// state.subscribe((val) => {
//   console.log("state:", val);
// });

// event.subscribe((val) => {
//   console.log("event:", val);
// });

export const markedNode = writable<MarkedNode>({
  node: undefined,
  color: "",
  autoScroll: false,
});

export const breakPoints = writable<number[]>([]);
export const jsonViewer = writableModified<object>({});
