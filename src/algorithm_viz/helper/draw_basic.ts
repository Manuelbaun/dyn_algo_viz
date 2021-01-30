import type { G } from "@svgdotjs/svg.js";
import { max, scaleLinear, ScaleLinear } from "d3";

export type Scales = {
  x: ScaleLinear<number, number, never>;
  y: ScaleLinear<number, number, never>;
  xInvert: (val: number) => number;
  yInvert: (val: number) => number;
  elementHeight: ScaleLinear<number, number, never>;
};

/**
 * This class contains the drawing sizes colors, scales etc..
 */
export class DrawBasic {
  // https://htmlcolorcodes.com/
  colors = {
    White: "#FFFFFF",
    Silver: "#C0C0C0",
    Gray: "#808080",
    Black: "#000000",
    Red: "#FF0000",
    Maroon: "#800000",
    Yellow: "#FFFF00",
    Olive: "#808000",
    Lime: "#00FF00",
    Green: "#008000",
    Aqua: "#00FFFF",
    Teal: "#008080",
    Blue: "#0000FF",
    Navy: "#000080",
    Fuchsia: "#FF00FF",
    Purple: "#800080",
  };

  drawRoot: G;
  width: number;
  height: number;

  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  drawHeight: number;
  drawWidth: number;
  bottomLine: number;

  elementWidth: number;

  scales: Scales;

  constructor(drawRoot: G, width: number, height: number, data: number[]) {
    this.margin = {
      top: 50,
      bottom: 50,
      left: 20,
      right: 20,
    };

    this.drawRoot = drawRoot;
    this.height = height;
    this.width = width;

    this.drawHeight = height - this.margin.top - this.margin.bottom;
    this.drawWidth = width - this.margin.left - this.margin.right;
    this.bottomLine = height - this.margin.bottom;

    const length = data.length;
    this.elementWidth = this.drawWidth / length - 2.5;

    /**
     * Scales, to map between pixels and the data vales
     * domain: data domain
     * range from to pixels
     */
    this.scales = {
      x: scaleLinear().domain([0, length]).range([0, width]),
      y: scaleLinear()
        .domain([0, 1])
        .range([0, height / 2]),
      xInvert: (val: number) => val / xStep,
      yInvert: (val: number) => val / yStep,
      elementHeight: scaleLinear()
        .domain([0, max(data)] as number[]) // the max value of the data
        .range([0, height / 2 - this.margin.top - 20]), // height minus bottom marginopen
    };

    // created step for inversion function!
    // somehow the d3 inverse does not work on y-axis
    const xStep = this.scales.x(1);
    const yStep = this.scales.y(1);
  }
}
