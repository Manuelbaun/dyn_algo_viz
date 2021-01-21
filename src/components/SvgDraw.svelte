<script lang="ts">
  import { onMount } from "svelte";
  import { Svg, SVG } from "@svgdotjs/svg.js";
  import panzoom from "panzoom";

  import { testAlgo } from "../interpreter/interpreter_test";
  import { appController } from "../service/app_controller";
  import ComparisonSorts from "../algorithms/comparison";
  import AnimationController from "../animation/animation_controller";

  let svgElement: SVGElement;
  onMount(async () => {
    const svgJS = SVG(svgElement) as Svg;
    // clear, if something was already drawn!
    svgJS.clear();

    const viewBox = svgJS.viewbox();
    const panzoomNode = svgJS.group();
    const drawRoot = panzoomNode.group();
    drawRoot.attr("id", "draw-root");

    const panZoomer = panzoom(panzoomNode.node, {
      zoomSpeed: 0.1, // 6.5% per mouse wheel event
      minZoom: 0.1,
      maxZoom: 20,
      initialZoom: 1,
      smoothScroll: false,
      bounds: true,
      boundsPadding: 0.0,
      autocenter: true,
    });

    const zoomFit = (paddingPercent = 0.75) => {
      const a = drawRoot.node.getBoundingClientRect();
      const box = drawRoot.bbox();
      const b = svgElement.getBoundingClientRect();
      let scale =
        Math.min(viewBox.width / box.width, viewBox.height / box.height) *
        paddingPercent;
      if (scale == Infinity) return;

      const t = panZoomer.getTransform();
      const x = b.x - a.x + t.x;
      const y = b.y - a.y + t.y;
      panZoomer.smoothZoomAbs(x, y, scale);
      panZoomer.centerOn(drawRoot.node);
    };

    const animationContorller = new AnimationController(appController);
    const algorithm = new ComparisonSorts(
      drawRoot,
      viewBox,
      animationContorller,
      panZoomer,
      zoomFit
    );

    const run = await testAlgo(algorithm);

    panZoomer.centerOn(drawRoot.node);

    appController.event.subscribe((event) => {
      if (event == "START") {
        run();
      }
    });
  });
</script>

<svg id="animejsID" viewBox="0 0 600 400" bind:this={svgElement} />

<style>
  svg {
    height: 100%;
    width: 100%;
    min-height: 500px;
  }
</style>
