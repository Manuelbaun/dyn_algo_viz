<script lang="ts">
  import { onMount } from "svelte";
  import { Svg, SVG } from "@svgdotjs/svg.js";
  import panzoom from "panzoom";

  import { appState } from "../service/app_state";
  import ComparisonSorts from "../algorithms/comparison";
  import AnimationController from "../animation/animation_controller";
  // needs .js, since it is a javascript file
  import { InterpreterWrapper } from "../interpreter/interpreter_wrapper.js";

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
      zoomSpeed: 0.2, // 6.5% per mouse wheel event
      minZoom: 0.1,
      maxZoom: 20,
      initialZoom: 1,
      smoothScroll: false,
      bounds: true,
      boundsPadding: 0.0,
      autocenter: true,
    });

    const animationContorller = new AnimationController(appState);

    const algorithm = new ComparisonSorts(
      drawRoot,
      viewBox,
      animationContorller,
      panZoomer
    );

    const setupDone = algorithm.setup();
    await setupDone;

    const wrapper = new InterpreterWrapper(algorithm);
    await wrapper.setup();

    panZoomer.centerOn(drawRoot.node);

    appState.currentTime.subscribe((state) => {
      if (appState.autofitValue) {
        const { width, height } = viewBox;
        const dW = drawRoot.width();
        const dH = drawRoot.height();
        const box = drawRoot.bbox();

        const wFac = 1 / (dW / width);
        const hFac = 1 / (dH / height);

        const zoom = Math.min(wFac, hFac);

        panZoomer.zoomAbs(box.x, box.y, zoom);
        panZoomer.centerOn(drawRoot.node);
      }
    });

    appState.event.subscribe(async (event) => {
      if (event == "START") {
        await setupDone;
        wrapper.run();
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
