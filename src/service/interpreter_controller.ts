import { get, writable } from "svelte/store";

function loadBreakPoints(): number[] {
  return JSON.parse(localStorage.getItem("breakPoints") || "[]") || [];
}
function saveBreakPoints(breakPoints: number[]) {
  localStorage.setItem("breakPoints", JSON.stringify(breakPoints));
}

function togglePointInArray(oldArray: number[], line: number) {
  const newArray = oldArray.filter((n) => n != line);

  if (newArray.length == oldArray.length) {
    newArray.push(line);
    newArray.sort((a, b) => a - b);
  }

  return newArray;
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
    const breakPoints = togglePointInArray(get(this.breakPoints), line);

    this.breakPoints.set(breakPoints);
    saveBreakPoints(breakPoints);
  }

  getBreakPoints() {
    const res = get(this.breakPoints);
    return res;
  }

  isBreakPoint(line: number) {
    return this.getBreakPoints().includes(line);
  }

  setLocalScope(localScope: object) {
    this.localScope.set(localScope);
  }
}

export const interpreterController = new InterpreterController();
