<script lang="ts">
  import { onMount } from "svelte";
  import { Svg, SVG } from "@svgdotjs/svg.js";

  import panzoom from "panzoom";
  import { testAlgo } from "../interpreter/interpreter_test";

  let svgElement: SVGElement;
  onMount(async () => {
    if (!svgElement) {
      throw Error(
        "A Fatal Error happend. The SVG element could not be found! This shoud not happen"
      );
    }

    const svgJS = SVG(svgElement) as Svg;
    // clear, if something was already drawn!
    // svgJS.clear();

    const viewBox = svgJS.viewbox();
    const panzoomNode = svgJS.group();
    const drawNode = panzoomNode.group();
    drawNode.attr("id", "draw-node");

    const pann = panzoom(panzoomNode.node, {
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
      const a = drawNode.node.getBoundingClientRect();
      const box = drawNode.bbox();
      const b = svgElement.getBoundingClientRect();
      let scale =
        Math.min(viewBox.width / box.width, viewBox.height / box.height) *
        paddingPercent;
      if (scale == Infinity) return;

      const t = pann.getTransform();
      const x = b.x - a.x + t.x;
      const y = b.y - a.y + t.y;
      pann.smoothZoomAbs(x, y, scale);
      pann.centerOn(drawNode.node);
    };

    const run = await testAlgo({
      svg: drawNode,
      viewBox,
      zoomFit,
    });

    // appController.events.subscribe((event) => {
    //   if (event == "START") {
    //     run();
    //   }
    // });
  });
</script>

<svg
  id="animejsID"
  width="100%"
  height="100%"
  viewBox="0 0 600 400"
  bind:this={svgElement}
/>
