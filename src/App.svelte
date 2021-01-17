<script lang="ts">
  import Codemirror from "./components/codemirror/Codemirror.svelte";
  import Controller from "./components/Controller.svelte";
  import JsonViewer from "./components/JsonViewer.svelte";
  import SvgDraw from "./components/SvgDraw.svelte";
</script>

<div class="container">
  <div class="columns">
    <div class="columns col-6">
      <SvgDraw />
    </div>
    <div class="columns col-6">
      <Codemirror />
    </div>
  </div>
  <div class="columns">
    <div class="columns col-6">
      <Controller />
    </div>
    <div class="columns col-6">
      <JsonViewer />
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
  }
</style>
