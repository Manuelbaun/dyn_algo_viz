<script lang="ts">
  import { onMount } from "svelte";
  /// import of webcomponent
  import "@alenaksu/json-viewer";

  import { appController } from "../../service/app_controller";
  import { interpreterController } from "../../service/interpreter_controller";

  const { progress, speed, state, event } = appController;
  const { breakPoints } = interpreterController;

  let jsonViewer: any;
  onMount(() => jsonViewer.expand("**.control"));

  // init data
  let data: object = {
    control: {
      progress: $progress,
      speed: $speed,
      state: $state,
      event: $event,
    },
    localScope: {},
    breakPoints: [],
  };

  // listen to data changes
  $: {
    if (jsonViewer) {
      jsonViewer.data = {
        control: {
          progress: $progress,
          speed: $speed,
          state: $state,
          event: $event,
        },
        localScope: {},
        breakPoints: $breakPoints,
      };
    }
  }
</script>

<json-viewer id="json" {data} bind:this={jsonViewer} />
