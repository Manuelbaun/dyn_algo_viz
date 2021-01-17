<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let value: number;
  export let min: number | string;
  export let max: number | string;
  export let step: number | string;

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
      <span>{value}</span>
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
  /* input[type="range"] {
    -webkit-appearance: none;
    margin: 20px 0;
    width: 100%;
  } */

  /* input[type="range"]:focus {
    outline: none;
  } */

  /* input[type="range"]:focus::-webkit-slider-runnable-track {
    background: #03a9f4;
  } */

  input::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    animation: 0.1s;
    /* background: #03a9f4; */
    /* border-radius: 25px; */
  }
  input::-webkit-slider-thumb {
    height: 20px;
    width: 20px;
    /* border-radius: 50%; */
    background: #fff;
    box-shadow: 0 0 4px 0 rgba(0, 0, 0, 1);
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -8px;
  }

  .range-wrap {
    width: 100%;
    position: relative;
  }

  .range-value {
    position: absolute;
    top: -100%;
  }

  .range-value span {
    min-width: 3em;
    height: 24px;
    line-height: 24px;
    text-align: center;
    background: #03a9f4;
    color: #fff;
    font-size: 12px;
    display: block;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    border-radius: 6px;
  }

  .range-value span:before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-top: 10px solid #03a9f4;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    margin-top: -1px;
  }
</style>
