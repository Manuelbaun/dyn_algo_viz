import { randomUniform, randomLcg } from "d3";

/**
 * Helperfunctions
 * @param items
 * @param max
 */

export const generateData = (items = 10, max = 300) => {
  const seed = 0.44871573888282423;
  const random = randomUniform.source(randomLcg(seed))(0, 1);
  return new Array(items)
    .fill(0)
    .map((d) => +Number(random() * max).toFixed(0));
};

let counter = 0;

export const genID = (leadingDot = false) => {
  const now = Date.now();
  const id = now.toString(36) + (++counter).toString(36);
  return leadingDot ? "." + id : id;
};
