<script lang="ts">
  import { appController } from "../service/app_controller";
  const { event, progress, speed, state } = appController;

  let mainButtonText = "Start";

  // reactive button text assignment
  $: {
    if ($state == "INIT") {
      mainButtonText = "Start";
    } else if ($state == "RUNNING") {
      mainButtonText = "Pause";
    } else if ($state == "PAUSED") {
      mainButtonText = "Continue";
    }
  }

  const handleMainButton = () => {
    if ($state == "INIT") appController.start();
    else if ($state == "RUNNING") appController.pause();
    else if ($state == "PAUSED" || $state == "STEPPING")
      appController.continue();
  };

  /// carefull, when binding click event directly to appController.step
  /// this will be undefined then!
  const step = () => appController.step();
  const stepIn = () => appController.stepIn();
  const reset = () => appController.reset();
</script>

<div>
  <input step=".01" min="0" max="100" type="range" bind:value={$progress} />
  {$progress}
</div>
<div>
  <input step=".01" type="range" min="0" max="10" bind:value={$speed} />
  {$speed}
</div>
<div>{$event}</div>
<div>{$state}</div>

<button on:click={handleMainButton}> {mainButtonText} </button>
<button on:click={step} disabled={$state != "PAUSED" && $state != "STEPPING"}>
  STEP
</button>
<button on:click={stepIn} disabled={$state != "PAUSED" && $state != "STEPPING"}>
  STEP IN
</button>
<button on:click={reset} disabled={$state == "INIT"}> RESET </button>
