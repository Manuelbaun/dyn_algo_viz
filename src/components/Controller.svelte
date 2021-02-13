<script lang="ts">
  import { scaleLinear } from "d3";

  import type { AppState } from "../service/app_state";
  import Slider from "./Slider.svelte";

  export let appState: AppState;

  const { progress, animationSpeed, state, autoscroll } = appState;

  const start = () => appState.start();
  const pause = () => appState.pause();
  const doContinue = () => appState.continue();
  const step = () => appState.step();
  const reset = () => appState.reset();

  /**
   * A scale, which maps the domain from min, max/2 to values between 0.1 - 1.
   * This is used, so, that the middle of the input range slider is the animation speed 1
   */
  const leftScale = scaleLinear().domain([0.1, 5]).range([0.1, 1]);
  /** this handles the values from max/2 -max, in the range of 1-10*/
  const rightScale = scaleLinear().domain([5, 10]).range([1, 10]);

  let sliderValue = 5;

  $: calcAnimationSpeed(sliderValue);

  function calcAnimationSpeed(sliderValue: number) {
    const val =
      sliderValue > 5 ? rightScale(sliderValue) : leftScale(sliderValue);
    animationSpeed.set(val);
  }
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
        bind:value={sliderValue}
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
      disabled={$state != "PAUSED" && $state != "STEPPING"}
    >
      CONTINUE
    </button>
    <button class="btn" on:click={pause} disabled={$state != "RUNNING"}>
      PAUSE
    </button>
    <button
      class="btn"
      on:click={step}
      disabled={$state != "PAUSED" && $state != "STEPPING"}
    >
      STEP
    </button>

    <button class="btn" on:click={reset}> RESET </button>
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
