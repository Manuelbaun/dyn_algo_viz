<script lang="ts">
  import type { AppState } from "../../service/app_state";

  import { onMount } from "svelte";
  import { CodeMirrorWrapper } from "./code_mirror";

  export let appState: AppState;

  let textRef: HTMLTextAreaElement;
  let codemirror: CodeMirrorWrapper;

  onMount(() => (codemirror = new CodeMirrorWrapper(appState, textRef)));
</script>

<div class="editor">
  <textarea bind:this={textRef} />
</div>

<style>
  .editor {
    text-align: left;
  }
</style>
