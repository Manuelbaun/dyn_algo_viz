<script lang="ts">
  import { appState } from "../service/app_state";
  import Slider from "./Slider.svelte";
  const { event, progress, speed, state, autofit, autoscroll } = appState;

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
  <div class="columns">
    <div class="column col-12">
      <Slider
        step=".01"
        min="0"
        max="100"
        bind:value={$progress}
        hint="Progress"
      />
    </div>
    <div class="column col-12">
      <Slider
        step=".01"
        min="0.1"
        max="10"
        bind:value={$speed}
        hint="Animation Speed"
      />
    </div>
  </div>

  <div class="btn-group btn-group-block">
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
  </div>

  <div class="columns">
    <div class="column col-6">
      <span>Last Event: {$event}</span>
    </div>
    <div class="column col-6">
      <div>State: {$state}</div>
    </div>

    <div class="form-group ">
      <label class="form-checkbox form-inline">
        <input type="checkbox" bind:checked={$autofit} />
        <i class="form-icon" />Autofit
      </label>
      <label class="form-checkbox form-inline">
        <input type="checkbox" bind:checked={$autoscroll} />
        <i class="form-icon" />AutoScroll
      </label>
    </div>
  </div>
</div>
