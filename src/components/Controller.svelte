<script lang="ts">
  import { appState } from "../service/app_state";
  import Slider from "./Slider.svelte";
  const { event, progress, speed, state, autofit } = appState;

  let mainButtonText = "Start";

  // reactive button text assignment
  $: {
    if ($state == "INIT") {
      mainButtonText = "Start";
    } else if ($state == "RUNNING") {
      mainButtonText = "Pause";
    } else if ($state == "PAUSED") {
      mainButtonText = "Continue";
    } else if ($state == "DONE") {
      mainButtonText = "Done";
    }
  }

  const handleMainButton = () => {
    if ($state == "INIT") appState.start();
    else if ($state == "RUNNING") appState.pause();
    else if ($state == "PAUSED" || $state == "STEPPING") appState.continue();
  };

  /// carefull, when binding click event directly to appState.step
  /// this will be undefined then!
  const step = () => appState.step();
  const stepIn = () => appState.stepIn();
  const reset = () => appState.reset();
</script>

<div class="container">
  <div class="container">
    <Slider step=".01" min="0" max="100" bind:value={$progress} />
    <Slider step=".01" min="0.1" max="10" bind:value={$speed} />

    <div>{$event}</div>
    <div>{$state}</div>
  </div>

  <div class="container">
    <button class="btn" on:click={handleMainButton} disabled={$state == "DONE"}>
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

    <div class="form-group">
      <label class="form-checkbox">
        <input type="checkbox" bind:checked={$autofit} />
        <i class="form-icon" />Autofit
      </label>
    </div>
  </div>
</div>
