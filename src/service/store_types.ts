import type acorn from "acorn";

export type STATE =
  | "DONE"
  | "ERROR"
  | "INIT"
  | "PAUSED"
  | "RUNNING"
  | "STEPPING";

export type EVENTS =
  | "CONTINUE"
  | "FINISH"
  | "INIT"
  | "PAUSE"
  | "RESET"
  | "SOME_ERROR"
  | "START"
  | "STEP"
  | "STEPIN";

export interface CustomAcornNode extends acorn.Node {
  loc: acorn.SourceLocation;
}
export type MarkedNode = {
  node: CustomAcornNode | undefined;
  color: string;
};
