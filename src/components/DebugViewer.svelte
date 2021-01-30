<script lang="ts">
  import { onMount } from "svelte";
  /// import of webcomponent
  import "@alenaksu/json-viewer";
  import type { AppState } from "../service/app_state";

  export let appState: AppState;

  // extract the stores, that are interesting to display
  const {
    progress,
    animationSpeed,
    state,
    currentTime,
    breakPoints,
    localScope,
    duration,
  } = appState;

  let jsonViewer: any;
  // init data
  let data: object = {};

  /// open the localScope, once the component is mounted
  onMount(() => jsonViewer?.expand("**.localScope"));

  // autosubscribe, when one of the listen stores changes,
  // then=>  compose the data => which updates the json-viewer
  // this triggers an update of the json-viewer
  $: data = {
    localScope: $localScope,
    breakPoints: $breakPoints,
    control: {
      duration: +$duration.toFixed(2) + " ms",
      currentTime: +$currentTime.toFixed(2) + " ms",
      progress: $progress.toFixed(2) + " %",
      speed: $animationSpeed.toFixed(2),
      state: $state,
    },
  };
</script>

<json-viewer id="json" {data} bind:this={jsonViewer} />

<style>
  :global(json-viewer) {
    --background-color: #282a36;
    --color: #f8f8f2;
    --font-family: monaco, Consolas, "Lucida Console", monospace;
    font-size: 1em;

    /* Types colors */
    --string-color: #7bff82;
    --number-color: #66d4ff;
    --boolean-color: #fa5fff;
    --null-color: #dd6dff;
    --property-color: #fffffa;

    /* Collapsed node preview */
    --preview-color: rgba(135, 245, 120, 0.9);

    /* Search highlight color */
    --highlight-color: #6fb3d2;
  }
</style>
