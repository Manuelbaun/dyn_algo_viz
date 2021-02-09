import type { G } from "@svgdotjs/svg.js";
import { max, scaleLinear, ScaleLinear } from "d3";

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

  /**
   * X-Axis Scale of the 2d-Grid
   * It takes an x-index value and returns the pixel position on the x-axis
   **/
  xScale: ScaleLinear<number, number, never>;

  /**
   * y-Axis Scale of the 2d-Grid
   * It takes an y-index value and returns the pixel position on the y-axis
   *
   * This is basically a multiplier of the 2d-Grids height.
   * The full height is the hight of the svg.
   *
   * if the Scale takes a 2 it return 2* (height/2), if 3 => 3*(height/2) etc.
   **/
  yScale: ScaleLinear<number, number, never>;

  /**
   * X-Axis Inverted Scale of the 2d-Grid
   *
   * It takes x-pixel values and returns the x-index of the 2d-grid
   */
  xScaleInvert: (val: number) => number;

  /**
   * Y-Axis Inverted Scale of the 2d-Grid
   *
   * It takes y-pixel values and returns the y-index of the 2d-grid
   */
  yScaleInvert: (val: number) => number;

  /**
   * This Scale is used, to scale the elements height in such a way,
   * that the maximum of the value never exceeds the allowed drawing height,
   * regardless what the maximum value of that data array is.
   */
  elementHeightScale: ScaleLinear<number, number, never>;

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

    this.elementWidth = this.drawWidth / data.length - 2.5;

    this.xScale = scaleLinear().domain([0, data.length]).range([0, width]);
    this.yScale = scaleLinear()
      .domain([0, 1])
      .range([0, height / 2]);

    // created step for inversion function!
    // somehow the d3 inverse does not work on y-axis
    const xStep = this.xScale(1);
    const yStep = this.yScale(1);

    this.xScaleInvert = (val: number) => val / xStep;
    this.yScaleInvert = (val: number) => val / yStep;

    this.elementHeightScale = scaleLinear()
      .domain([0, max(data)] as number[]) // the max value of the data
      .range([0, height / 2 - this.margin.top - 20]); // height minus bottom margin open
  }
}
