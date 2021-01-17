<script lang="ts">
  import { onMount } from "svelte";
  import { CodeMirrorWrapper } from "./code_mirror";

  import { editorController } from "../../service/editor_controller";

  const { markedNode } = editorController;
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
    width: 100%;
    height: 100%;
  }
</style>
