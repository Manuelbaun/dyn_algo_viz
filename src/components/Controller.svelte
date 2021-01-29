<script lang="ts">
  import type { AppState } from "../service/app_state";
  import Slider from "./Slider.svelte";

  export let appState: AppState;

  const {
    progress,
    animationSpeed,
    animationSpeedSlider,
    state,
    autoscroll,
  } = appState;

  const start = () => appState.start();
  const pause = () => appState.pause();
  const doContinue = () => appState.continue();
  const stepIn = () => appState.stepIn();
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
    <button class="btn" on:click={start} disabled={$state != "INIT"}>
      START
    </button>
    <button
      class="btn"
      on:click={doContinue}
      disabled={$state != "PAUSED" && $state != "STEPPING"}> CONTINUE </button>
    <button class="btn" on:click={pause} disabled={$state != "RUNNING"}>
      PAUSE
    </button>
    <button
      class="btn"
      on:click={stepIn}
      disabled={$state != "PAUSED" && $state != "STEPPING"}> STEP </button>
  </div>

  <div class="columns">
    <div class="form-group ">
      <label class="form-checkbox form-inline">
        <input type="checkbox" bind:checked={$autoscroll} />
        <i class="form-icon" /> AutoScroll
      </label>
    </div>
  </div>
</div>
