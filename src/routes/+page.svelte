<script lang="ts">
  import Editor from "$lib/editor/Editor.svelte";
  import "../app.css";

  const text = `public set(mode: string, key: string, action: () => void) {
    switch (mode) {
      case 'n':
        this.NormalInputMap.set(key, action);
        break;
      case 'i':
        this.InsertInputMap.set(key, action);
        break;
      case 'v':
        this.VisualInputMap.set(key, action);
        break;
      case 'o':
        this.OptionInputMap.set(key, action);
        break;
      case 't':
        console.log("not implemented lol")
        break;
    }
  }
 `;
</script>

<div>
  <Editor {text} />
</div>
