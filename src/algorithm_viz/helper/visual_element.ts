import type { G, Rect, Text } from "@svgdotjs/svg.js";
import type { DrawUtilities } from "./draw_utilities";

export class VisualElement {
  // the root group, which contains the text and rectangle
  readonly value: number;
  private rootEl: G;
  private rectEl: Rect;
  private textEl: Text;
  private draw: DrawUtilities;

  constructor(value: number, draw: DrawUtilities) {
    this.draw = draw;
    // set initial transform of Y
    // create group element, to group rect and text together => less work
    this.rootEl = draw.drawRoot.group().attr({ opacity: 0.0 });
    this.value = value;

    /// create rect in previous created group
    /// the dy(bottomline - height), means where to put the start of the bar
    /// since coordinate systems start from top left corner
    const height = this.draw.elementHeightScale(value);

    this.rectEl = this.rootEl
      .rect(this.draw.elementWidth, height)
      .attr({ fill: this.draw.colors.Silver })
      .dy(this.draw.bottomLine - height);

    /// create text in previous created group
    this.textEl = this.rootEl
      .text(value.toString())
      .font({ size: 10 })
      .dy(this.draw.bottomLine);
  }

  get rootNode() {
    return this.rootEl.node;
  }

  get rectNode() {
    return this.rectEl.node;
  }

  // X position of the element (invert of the scales)
  get xIndex() {
    return Math.round(
      this.draw.xScaleInvert(this.transformedXYPosition.translateX)
    );
  }

  // Y position of the element (invert of the scales)
  get yIndex() {
    // normally d3 scale have an inverse function,
    // but it does not work properly on the y scale???
    // bug in y.inverse()
    return Math.round(
      this.draw.yScaleInvert(this.transformedXYPosition.translateY)
    );
  }

  // Pixel X position of the element
  get xPixel() {
    return this.transformedXYPosition.translateX;
  }

  // Pixel Y position of the element
  get yPixel() {
    return this.transformedXYPosition.translateY;
  }

  /**
   * Unfortunately, the SVGjs lib does not work 100% with the animation
   * of animejs. The Transform property of the svg elements from a group
   * uses a matrix. Animejs uses the style.transform
   *
   * this is a workaround
   */
  private get transformedXYPosition() {
    const matrix = new WebKitCSSMatrix(this.rootNode.style.transform);
    return { translateX: matrix.e, translateY: matrix.f };
  }
}
