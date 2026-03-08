<script lang="ts">
  import Editor from "$lib/editor/Editor.svelte";
  import "../app.css";

  const text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Morbi finibus, elit non scelerisque consequat, massa orci molestie nisl, in cursus leo elit eu ligula.
Praesent vehicula massa nec rutrum efficitur.
Maecenas nulla leo, rhoncus id neque id, tincidunt maximus odio.
Suspendisse sed vehicula justo.
Maecenas finibus fermentum consectetur.
Sed vel sem convallis lacus iaculis interdum id at est.
Nunc ac elit eu mi scelerisque molestie.
`;
</script>

<div>
  <Editor {text} />
</div>
