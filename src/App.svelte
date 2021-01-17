<script lang="ts">
  import Codemirror from "./components/codemirror/Codemirror.svelte";
  import Controller from "./components/Controller.svelte";
  import JsonViewer from "./components/json-viewer/JsonViewer.svelte";
  import SvgDraw from "./components/SvgDraw.svelte";
</script>

<div class="App">
  <SvgDraw />
  <Controller />
  <Codemirror />
  <JsonViewer />
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
  }
  .App {
    text-align: left;
  }
</style>
