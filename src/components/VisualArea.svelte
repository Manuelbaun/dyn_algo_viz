<svelte:options accessors={true} />

<script lang="ts">
  /**
   * When working on this component with hmr enabled, snowpack will replace this component
   * with a new one, and svelte is not able to find the proper svg reference, and so,
   * it cannot draw the elements to the screen.
   * Solutions:
   *  1. Just refresh the browser
   */
  import { onMount } from "svelte";
  import { G, Svg, SVG } from "@svgdotjs/svg.js";
  import panzoom from "panzoom";
  import type { PanZoom } from "panzoom";

  let svgElement: SVGElement;
  let panZoomer: PanZoom;
  let drawRoot: G;
  let svgJS: Svg;

  /**
   * Note:
   * the width and hight does not set the width and height
   * of the svg element itself, but rather sets the viewport
   */
  export let width: number;
  export let height: number;
  const viewBoxStr = `0 0 ${width} ${height}`;

  /// create getters until a better solution is proposed
  export const getDrawRoot = () => drawRoot;
  export const getWidth = () => width;
  export const getHeight = () => height;

  // wait, till children are mounted
  onMount(() => clearAndInit());

  export function clearAndInit() {
    svgJS = SVG(svgElement) as Svg;
    // clear the entire svg area
    svgJS?.clear();

    const panzoomNode = svgJS.group();
    drawRoot = panzoomNode.group();
    drawRoot.attr("id", "draw-root");

    // create the pan and zoom component and add to the svg!
    panZoomer = panzoom(panzoomNode.node, {
      zoomSpeed: 0.2, // 6.5% per mouse wheel event
      minZoom: 0.1,
      maxZoom: 20,
      initialZoom: 1,
      smoothScroll: false,
      bounds: true,
      boundsPadding: 0.0,
      autocenter: true,
    });
  }

  export function center() {
    panZoomer.centerOn(drawRoot.node);
  }

  /** Try the experimental Autofit feature */
  export function autoFit() {
    const dW = drawRoot.width();
    const dH = drawRoot.height();
    const box = drawRoot.bbox();

    const wFac = 1 / (dW / width);
    const hFac = 1 / (dH / height);

    const zoom = Math.min(wFac, hFac);
    panZoomer.smoothZoomAbs(box.x, box.y, zoom);

    setTimeout(() => panZoomer.centerOn(drawRoot.node), 500);
  }
</script>

<svg id="animejsID" viewBox={viewBoxStr} bind:this={svgElement} />

<style>
  svg {
    height: 100%;
    width: 100%;
    min-height: 500px;
  }
</style>
