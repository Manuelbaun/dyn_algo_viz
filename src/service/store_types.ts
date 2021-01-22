import type acorn from "acorn";

export type STATE =
  | "RUNNING"
  | "PAUSED"
  | "INIT"
  | "DONE"
  | "STEPPING"
  | "ERROR";

export type EVENTS =
  | "START"
  | "PAUSE"
  | "CONTINUE"
  | "INIT"
  | "RESET"
  | "STEP"
  | "STEPIN"
  | "FINISH"
  | "SOME_ERROR";

export interface CustomAcornNode extends acorn.Node {
  loc: acorn.SourceLocation;
}
export type MarkedNode = {
  node: CustomAcornNode | undefined;
  color: string;
  autoScroll: boolean;
};
