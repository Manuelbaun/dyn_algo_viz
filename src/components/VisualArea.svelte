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
  import { Box, G, Svg, SVG } from "@svgdotjs/svg.js";
  import panzoom from "panzoom";
  import type { PanZoom } from "panzoom";

  let svgElement: SVGElement;
  let panZoomer: PanZoom;
  let viewBox: Box;

  /// create getters until a better solution is proposed
  export const getDrawRoot = () => drawRoot;
  export const getWidth = () => width;
  export const getHeight = () => height;

  let drawRoot: G;
  let width: number;
  let height: number;

  onMount(() => {
    const svgJS = SVG(svgElement) as Svg;
    viewBox = svgJS.viewbox();

    width = viewBox.width;
    height = viewBox.height;

    const panzoomNode = svgJS.group();
    drawRoot = panzoomNode.group();
    drawRoot.attr("id", "draw-root");

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
  });

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

<svg id="animejsID" viewBox="0 0 600 400" bind:this={svgElement} />

<style>
  svg {
    height: 100%;
    width: 100%;
    min-height: 500px;
  }
</style>
