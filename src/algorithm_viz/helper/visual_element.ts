import type { G, Rect, Text } from "@svgdotjs/svg.js";
import type { DrawBasic, Scales } from "./draw_basic";

export class VisualElement {
  // the root group, which contains the text and rectangle
  readonly value: number;
  private root: G;
  private rectEl: Rect;
  private textEl: Text;
  private draw: DrawBasic;
  private scales: Scales;

  constructor(value: number, draw: DrawBasic) {
    this.draw = draw;
    // set initial transform of Y
    // create group element, to group rect and text together => less work
    this.root = draw.drawRoot.group().attr({ opacity: 0.0 });
    this.scales = this.draw.scales;
    this.value = value;

    /// create rect in previous created group
    /// the dy(bottomline - height), means where to put the start of the bar
    /// since coordinate systems start from top left corner
    const height = this.draw.scales.elementHeight(value);

    this.rectEl = this.root
      .rect(this.draw.elementWidth, height)
      .attr({ fill: this.draw.colors.Silver })
      .dy(this.draw.bottomLine - height);

    /// create text in previous created group
    this.textEl = this.root
      .text(value.toString())
      .font({ size: 10 })
      .dy(this.draw.bottomLine);
  }

  get node() {
    return this.root.node;
  }

  get rectNode() {
    return this.rectEl.node;
  }

  // X position of the element (invert of the scales)
  get x() {
    return Math.round(this.scales.xInvert(this.matrix.translateX));
  }

  // Y position of the element (invert of the scales)
  get y() {
    // normally d3 scale have an inverse function,
    // but it does not work properly on the y scale???
    // bug in y.inverse()
    return Math.round(this.scales.yInvert(this.matrix.translateY));
  }

  // Pixel X position of the element
  get posX() {
    return this.matrix.translateX;
  }

  // Pixel Y position of the element
  get posY() {
    return this.matrix.translateY;
  }

  /**
   * Unfortunately, the SVGjs lib does not work 100% with the animation
   * of animejs. The Transform property of the svg elements from a group
   * uses a matrix. Animejs uses the style.transfrom
   *
   * this is a workaround
   */
  private get matrix() {
    const matrix = new WebKitCSSMatrix(this.node.style.transform);
    return { translateX: matrix.e, translateY: matrix.f };
  }
}
