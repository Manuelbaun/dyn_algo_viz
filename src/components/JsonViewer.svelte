<script lang="ts">
  import { onMount } from "svelte";
  /// import of webcomponent
  import "@alenaksu/json-viewer";

  import { appController } from "../service/app_controller";
  import { interpreterController } from "../service/interpreter_controller";

  const { progress, speed, state, event } = appController;
  const { breakPoints, localScope } = interpreterController;

  let jsonViewer: any;
  onMount(() => jsonViewer.expand("**.localScope"));

  // init data
  let data: object = {};

  function jsonData() {
    data = {
      localScope: $localScope,
      breakPoints: $breakPoints,
      control: {
        progress: $progress,
        speed: $speed,
        state: $state,
        event: $event,
      },
    };
  }
  // autosubscribe and listen to data changes
  $: $progress, $speed, $state, $event, $breakPoints, jsonData();
</script>

<json-viewer id="json" {data} bind:this={jsonViewer} />
