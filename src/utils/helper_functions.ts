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

/**
 * Somehow, the transform attributes of the svg elements cannot be
 * read properly. Therefor, the getComputed function calculates them
 */
export function getComputedTransform(node: SVGGElement) {
  const cssDeclartion = getComputedStyle(node);
  var matrix = new WebKitCSSMatrix(cssDeclartion.transform);

  const mm = {
    translateX: matrix.e,
    translateY: matrix.f,
    x: matrix.a,
    y: matrix.b,
    matrix,
  };
  return mm;
}

export function findDiff(str1: string, str2: string) {
  let diff = "";
  str2.split("").forEach(function (val, i) {
    if (val != str1.charAt(i)) diff += val;
  });
  return diff;
}

let counter = 0;

export const genID = (leadingDot = false) => {
  const now = Date.now();
  const id = now.toString(36) + (++counter).toString(36);
  return leadingDot ? "." + id : id;
};

// https://github.com/foxdonut/meiosis/blob/master/helpers/setup/source/src/util/index.js
type Key = number | string | symbol;

export function get<P extends readonly Key[]>(object: any, path: P) {
  return path.reduce(
    (obj, key) => (obj == undefined ? undefined : obj[key]),
    object
  );
}

/**
 * This function will insert the data into the object, by the given path
 * first, the path will be split by '.', then is will run the path and insert the data.
 *
 * important!!!: it will not merge the end path, it will override it!
 */
export function set(object: any, path: string[], data: any) {
  let subobject = object;

  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];

    if (!subobject[p]) {
      subobject[p] = {};
    }
    subobject = subobject[p];
  }

  subobject[path[path.length - 1]] = data;
}

const time = false;

export function measure(tag: string, func: Function) {
  time && console.time(tag);
  const res = func();
  time && console.timeEnd(tag);
  return res;
}

function getTranslation(transform: string) {
  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function
  // returns.
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Set the transform attribute to the provided string value.
  g.setAttributeNS(null, "transform", transform);

  // consolidate the SVGTransformList containing all transformations
  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
  // its SVGMatrix.
  var matrix = g.transform.baseVal.consolidate().matrix;

  // As per definition values e and f are the ones for the translation.
  return matrix;
}
