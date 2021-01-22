<script lang="ts">
  import { onMount } from "svelte";
  import { CodeMirrorWrapper } from "./code_mirror";

  let textRef: HTMLTextAreaElement;
  let codemirror: CodeMirrorWrapper;

  onMount(() => {
    codemirror = new CodeMirrorWrapper(textRef);
  });
</script>

<div class="editor">
  <textarea bind:this={textRef} />
</div>

<style>
  .editor {
    text-align: left;
    width: 100%;
    height: 100%;
  }
</style>
