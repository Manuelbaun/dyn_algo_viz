<script lang="ts">
  import Codemirror from "./components/codemirror/Codemirror.svelte";
  import Controller from "./components/Controller.svelte";
  import JsonViewer from "./components/JsonViewer.svelte";
  import SvgDraw from "./components/SvgDraw.svelte";
</script>

<div class="container">
  <div class="columns">
    <div class="column">
      <SvgDraw />
    </div>
    <div class="divider-vert" />

    <div class="column">
      <Codemirror />
    </div>
  </div>
  <div class="divider text-center" data-content="Control" />

  <div class="columns">
    <div class="column">
      <Controller />
    </div>
    <div class="divider-vert" />

    <div class="column">
      <JsonViewer />
    </div>
  </div>
</div>
