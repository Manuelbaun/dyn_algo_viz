<script lang="ts">
  import { onMount } from "svelte";
  /// import of webcomponent
  import "@alenaksu/json-viewer";

  import { appState } from "../service/app_state";

  const {
    progress,
    speed,
    state,
    event,
    currentTime,
    breakPoints,
    localScope,
  } = appState;

  let jsonViewer: any;
  onMount(() => jsonViewer.expand("**.localScope"));

  // init data
  let data: object = {};

  function jsonData() {
    data = {
      localScope: $localScope,
      breakPoints: $breakPoints,
      control: {
        progress: $progress.toFixed(2) + " %",
        speed: $speed,
        state: $state,
        event: $event,
        currentTime: +$currentTime.toFixed(2) + " ms",
      },
    };
  }
  // autosubscribe and listen to data changes
  $: $progress, $speed, $state, $event, $breakPoints, jsonData();
</script>

<json-viewer id="json" {data} bind:this={jsonViewer} />
