<script lang="ts">
  import type { Box, G } from "@svgdotjs/svg.js";

  import { onMount } from "svelte";
  import ComparisonSorts from "./algorithm_viz/comparison";
  import AnimationController from "./animation/animation_controller";

  import Codemirror from "./components/codemirror/Codemirror.svelte";
  import Controller from "./components/Controller.svelte";
  import JsonViewer from "./components/JsonViewer.svelte";
  import SvgDraw from "./components/SvgDraw.svelte";

  import { InterpreterWrapper } from "./interpreter/interpreter_wrap";
  import { AppState } from "./service/app_state";

  // get the reference of the svgDraw, to get the needed references!
  let svgDraw: SvgDraw;

  // init State
  const appState = AppState.getInstance();

  onMount(async () => {
    const aniController = new AnimationController(appState);
    const algorithm = new ComparisonSorts(
      aniController,
      svgDraw.getDrawRoot(),
      svgDraw.getWidth(),
      svgDraw.getHeight()
    );
    await algorithm.setup();

    svgDraw.center();

    const interpreter = new InterpreterWrapper(appState, algorithm);
  });
</script>

<div class="container">
  <div class="columns">
    <div class="column">
      <SvgDraw bind:this={svgDraw} />
    </div>
    <div class="divider-vert" />

    <div class="column">
      <Codemirror {appState} />
    </div>
  </div>
  <div class="divider text-center" data-content="Control" />

  <div class="columns">
    <div class="column">
      <Controller {appState} />
    </div>
    <div class="divider-vert" />

    <div class="column">
      <JsonViewer {appState} />
    </div>
  </div>
</div>
