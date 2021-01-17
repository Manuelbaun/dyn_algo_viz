<script lang="ts">
  import { onMount } from "svelte";
  import { markedNode } from "../../service/store";
  import { CodeMirrorWrapper } from "./code_mirror";

  let textRef: HTMLTextAreaElement;
  let codemirror: CodeMirrorWrapper;

  onMount(() => {
    codemirror = new CodeMirrorWrapper(textRef);
  });

  // lable to auto subscribe markedNode changes
  $: {
    codemirror?.markNode($markedNode);
  }
</script>

<div class="editor">
  <textarea bind:this={textRef} />
</div>

<style>
  .editor {
    text-align: left;
  }
</style>
