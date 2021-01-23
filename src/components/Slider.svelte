<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let value: number;
  export let min: number | string;
  export let max: number | string;
  export let step: number | string;
  export let hint: string = "";

  let range: HTMLInputElement;
  let tooltip: HTMLDivElement;

  let newPosition: number;
  let newValue: number;

  const calcPosition = (value: number) => {
    if (tooltip) {
      newValue = Number(((value - +min) * 100) / (+max - +min));
      newPosition = 10 - newValue * 0.2;
      tooltip.style.left = `calc(${newValue}% + (${newPosition}px))`;
    }
  };

  onMount(() => calcPosition(value));

  let show = false;

  function toggleShow() {
    show = !show;
  }

  // need value to be tracked!
  $: tooltip && calcPosition(value);
</script>

<div class="range-wrap">
  {#if show}
    <div
      class="range-value"
      id="myrange"
      bind:this={tooltip}
      transition:fade={{ duration: 200 }}
    >
      <span class="label label-primary">
        <div class="label-text">
          {hint || ""}
        </div>
        <div>
          {value.toFixed(2)}
        </div>
      </span>
    </div>
  {/if}
  <input
    on:mouseenter={toggleShow}
    on:mouseleave={toggleShow}
    id="myslider"
    class="slider"
    type="range"
    {step}
    {min}
    {max}
    bind:value
    bind:this={range}
  />
</div>

<style>
  input::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    animation: 0.1s;
  }
  input::-webkit-slider-thumb {
    height: 20px;
    width: 20px;
    background: #fff;
    box-shadow: 0 0 4px 0 rgba(0, 0, 0, 1);
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -8px;
  }

  .label-text {
    display: block;
    width: auto;
    white-space: nowrap;
  }

  .range-wrap {
    width: 100%;
    position: relative;
    z-index: 100;
  }

  .range-value {
    position: absolute;
    top: -220%;
  }

  .range-value span {
    min-width: auto;
    width: auto;
    text-align: center;
    position: absolute;
    transform: translate(-50%, 0);
  }

  .range-value span:before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-top: 10px solid;
    border-top-color: #5755d9;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    margin-top: -1px;
  }
</style>
