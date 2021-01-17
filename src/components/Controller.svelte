<script lang="ts">
  import { appController } from "../service/app_controller";
  import Slider from "./Slider.svelte";
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

<div class="container">
  <div class="container">
    <Slider step=".01" min="0" max="100" bind:value={$progress} unit="%" />
    <Slider step=".01" min="0" max="10" bind:value={$speed} />

    <div>{$event}</div>
    <div>{$state}</div>
  </div>

  <div class="container">
    <button class="btn" on:click={handleMainButton}>
      {mainButtonText}
    </button>
    <button
      class="btn"
      on:click={step}
      disabled={$state != "PAUSED" && $state != "STEPPING"}> STEP </button>
    <button
      class="btn"
      on:click={stepIn}
      disabled={$state != "PAUSED" && $state != "STEPPING"}> STEP IN </button>
    <button class="btn" on:click={reset} disabled={$state == "INIT"}>
      RESET
    </button>
  </div>
</div>
