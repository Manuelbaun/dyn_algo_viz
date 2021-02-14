<script lang="ts">
  import { onMount } from "svelte";
  import ComparisonSorts from "./algorithm_viz/comparison_sort_visualizer";
  import AnimationController from "./animation/animation_controller";

  import Editor from "./components/editor/Editor.svelte";
  import Controller from "./components/Controller.svelte";
  import DebugViewer from "./components/DebugViewer.svelte";
  import VisualArea from "./components/VisualArea.svelte";

  import { InterpreterWrapper } from "./interpreter/interpreter_wrap";
  import { AppState } from "./service/app_state";
  import { generateData } from "./utils/helper_functions";
  import { DrawUtilities } from "./algorithm_viz/helper/draw_utilities";
  import { draw } from "svelte/transition";

  // get the reference of the svgDraw, to get the needed references!
  let svgDraw: VisualArea;

  // init State
  const appState = AppState.getInstance();
  const { event } = appState;

  const width = 600;
  const height = 400;

  let animationController: AnimationController;
  let algorithm: ComparisonSorts;
  let interpreter: InterpreterWrapper;

  // could be set by the appState? and use a slider?
  let count: number = 20;

  // wait, till children are mounted
  onMount(() => initAlgoViz());

  // autosubscribe to the reset event
  $: if ($event == "reset") reset();

  /**
   * Reset function does two things:
   * 1. it clears everything, first
   * 2. it reinits the algoviz
   */
  function reset() {
    svgDraw?.clearAndInit();
    interpreter?.dispose();
    algorithm?.dispose();
    animationController?.dispose();

    // re init
    initAlgoViz();
  }

  // init the algoviz components
  async function initAlgoViz() {
    animationController = new AnimationController(appState);

    const data = Array.from(new Set(generateData(count).map((e) => e + 1)));

    const drawUtils = new DrawUtilities(
      svgDraw.getDrawRoot(),
      width,
      height,
      data
    );

    algorithm = new ComparisonSorts(animationController, data, drawUtils);
    await algorithm.setup();

    svgDraw.center();

    interpreter = new InterpreterWrapper(appState, algorithm);
  }
</script>

<div class="container">
  <div class="columns">
    <div class="column">
      <VisualArea bind:this={svgDraw} {width} {height} />
    </div>
    <div class="divider-vert" />

    <div class="column">
      <Editor {appState} />
    </div>
  </div>
  <div class="divider text-center" data-content="Control" />
  <div class="columns">
    <div class="column">
      <Controller {appState} />
    </div>
    <div class="divider-vert" />

    <div class="column">
      <DebugViewer {appState} />
    </div>
  </div>
</div>
