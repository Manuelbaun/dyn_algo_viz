import type acorn from "acorn";

export type STATE =
  | "DONE"
  | "ERROR"
  | "INIT"
  | "PAUSED"
  | "RUNNING"
  | "STEPPING";

export type EVENTS =
  | "continue"
  | "finish"
  | "init"
  | "pause"
  | "reset"
  | "some_error"
  | "start"
  | "step"
  | "stepin";

export interface CustomAcornNode extends acorn.Node {
  loc: acorn.SourceLocation;
}
export type MarkedNode = {
  node: CustomAcornNode | undefined;
  color: string;
};
