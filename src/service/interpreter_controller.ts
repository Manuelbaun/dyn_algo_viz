import { get, writable } from "svelte/store";

function loadBreakPoints(): number[] {
  return JSON.parse(localStorage.getItem("breakPoints") || "[]") || [];
}
function saveBreakPoints(breakPoints: number[]) {
  localStorage.setItem("breakPoints", JSON.stringify(breakPoints));
}

export class InterpreterController {
  readonly localScope = writable<object>({});
  readonly errors = writable<object>({});
  readonly breakPoints = writable<number[]>(loadBreakPoints());

  constructor() {
    this.localScope.subscribe((data) => console.log("LOCALScope", data));
    this.errors.subscribe((data) => console.log("Errors", data));
    this.breakPoints.subscribe((data) => console.log("BreakPoints", data));
  }

  toggleBreakPoint(line: number) {
    const old = this.getBreakPoints();
    const breakPoints = old.filter((n) => n != line);

    if (breakPoints.length == old.length) {
      breakPoints.push(line);
      breakPoints.sort((a, b) => a - b);
    }

    this.breakPoints.set(breakPoints);
    saveBreakPoints(breakPoints);
  }

  getBreakPoints() {
    return get(this.breakPoints);
  }

  setLocalScope(localScope: object) {
    this.localScope.set(localScope);
  }
}

export const interpreterController = new InterpreterController();
