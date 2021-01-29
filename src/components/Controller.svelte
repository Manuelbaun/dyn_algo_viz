<script lang="ts">
  import { appState } from "../service/app_state";
  import Slider from "./Slider.svelte";
  const {
    event,
    progress,
    animationSpeed,
    animationSpeedSlider,
    state,
    autofit,
    autoscroll,
  } = appState;

  let mainButtonText = "Start";

  // reactive button text assignment
  $: {
    if ($state == "INIT") {
      mainButtonText = "START";
    } else if ($state == "RUNNING") {
      mainButtonText = "RUNNING";
    } else if ($state == "PAUSED") {
      mainButtonText = "Continue";
    } else if ($state == "DONE") {
      mainButtonText = "DONE";
    }
  }

  const handleMainButton = () => {
    if ($state == "INIT") appState.start();
    else if ($state == "PAUSED" || $state == "STEPPING") appState.continue();
  };

  const pause = () => {
    if ($state == "RUNNING") appState.pause();
  };

  const stepIn = () => appState.stepIn();

  // currently only stepIn works properly
  // const step = () => appState.step();
  // const reset = () => appState.reset();
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
        bind:value={$animationSpeedSlider}
        displayValue={$animationSpeed.toFixed(2)}
        hint="Animation Speed"
      />
    </div>
  </div>

  <div class="btn-group btn-group-block">
    <button
      class="btn"
      on:click={handleMainButton}
      disabled={$state == "DONE" || $state == "RUNNING"}>
      {mainButtonText}
    </button>

    <button
      class="btn"
      on:click={pause}
      disabled={$state != "RUNNING" && $state != "STEPPING"}> PAUSE </button>
    <button
      class="btn"
      on:click={stepIn}
      disabled={$state != "PAUSED" && $state != "STEPPING"}> STEP </button>
  </div>

  <div class="columns">
    <div class="form-group ">
      <label class="form-checkbox form-inline">
        <input type="checkbox" bind:checked={$autofit} />
        <i class="form-icon" />Autofit (Experimental)
      </label>
      <label class="form-checkbox form-inline">
        <input type="checkbox" bind:checked={$autoscroll} />
        <i class="form-icon" />AutoScroll
      </label>
    </div>
  </div>
</div>
