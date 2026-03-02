<script lang="ts">
  import { onMount } from "svelte";
  import { TextEditor } from "./Editor.svelte.ts";
  import { EditorStateEnum } from "./Modes/EditorModes.ts";
  import { Settings } from "./Settings.ts";
  import { BufferTypeEnum } from "./Structs/GapBuffer.svelte.ts";

  function should_highlight(line_pos: number, char_pos: number): boolean {
    const [start_y, end_y] = [
      Math.min(TextEditor.VisualBufferStart.y, TextEditor.VisualBufferEnd.y),
      Math.max(TextEditor.VisualBufferStart.y, TextEditor.VisualBufferEnd.y),
    ];

    const [start_x, end_x] =
      start_y === TextEditor.VisualBufferStart.y
        ? [TextEditor.VisualBufferStart.x, TextEditor.VisualBufferEnd.x]
        : [TextEditor.VisualBufferEnd.x, TextEditor.VisualBufferStart.x];

    if (line_pos < start_y || line_pos > end_y) return false;
    if (line_pos === start_y && char_pos < start_x) return false;
    if (line_pos === end_y && char_pos > end_x) return false;

    return true;
  }

  function render_cursor(line_pos: number, char_pos: number): string {
    if (TextEditor.CursorPos == char_pos && TextEditor.LinePos == line_pos) {
      if (TextEditor.State === EditorStateEnum.INSERT) {
        return `cursor-edit ${TextEditor.InsertBefore ? "cursor-edit-before" : "cursor-edit-after"}`;
      } else {
        return "cursor-normal";
      }
    } else if (
      TextEditor.State === EditorStateEnum.VISUAL &&
      should_highlight(line_pos, char_pos)
    ) {
      return "cursor-visual";
    }

    return "";
  }

  onMount(() => {
    document.addEventListener("keydown", (ev) => TextEditor.MapInput(ev));
  });
</script>

<div class="text-editor" style="font-size: {Settings.FontSize + 'px'}">
  {#each TextEditor.Text as line, line_num}
    <div class="line">
      <span class="line-number">{line_num}</span>
      <span class="line-content">
        {#if line.BufferPresent && line.ActiveZone}
          {#if line.BufferType === BufferTypeEnum.REGION}
            {#each line.BufferLeft + line.ActiveZone + line.BufferRight as char, char_num}
              <span
                class="char {render_cursor(line_num, char_num)} "
                style="display: inline-block;"
              >
                {char === "\n" ? "-" : char}
              </span>
            {/each}
          {:else if line.BufferType === BufferTypeEnum.SPLITLEFT}
            {#each line.ActiveZone + line.BufferLeft as char, char_num}
              <span
                class="char {render_cursor(line_num, char_num)} "
                style="display: inline-block;"
              >
                {char === "\n" ? "-" : char}
              </span>
            {/each}
          {:else}
            {#each line.BufferRight + line.ActiveZone as char, char_num}
              <span
                class="char {render_cursor(line_num, char_num)} "
                style="display: inline-block;"
              >
                {char === "\n" ? "-" : char}
              </span>
            {/each}
          {/if}
        {:else}
          {#each line.Span as char, char_num}
            <span
              class="char {render_cursor(line_num, char_num)} "
              style="display: inline-block;"
            >
              {char === "\n" ? "-" : char}
            </span>
          {/each}
        {/if}
      </span>
    </div>
  {/each}
  <span>{TextEditor.State}</span>
  <span>{TextEditor.LinePos}:{TextEditor.CursorPos}</span>
</div>

<style>
  .text-editor {
    font-family: monospace;
    line-height: 1.5;
  }

  .line {
    display: flex;
    white-space: nowrap;
  }

  .line-number {
    display: inline-block;
    min-width: 30px;
    max-width: 30px;
    text-align: right;
    padding-right: 12px;
    color: #666;
    user-select: none;
  }

  .line-content {
    display: inline-block;
    letter-spacing: 0;
  }

  .char {
    display: inline-block;
    width: 1ch;
    text-align: center;
    position: relative;
    white-space: pre;
  }

  .cursor-edit {
    position: relative;
  }

  .cursor-visual {
    background-color: #666;
    color: white;
  }

  .cursor-edit-before::before {
    content: "";
    position: absolute;
    left: -1px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #666;
    animation: cursor-blink 1s step-end infinite;
  }

  .cursor-edit-after::after {
    content: "";
    position: absolute;
    right: -1px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #666;
    animation: cursor-blink 1s step-end infinite;
  }

  .cursor-normal {
    background-color: #666;
    color: white;
    animation: cursor-blink 1s step-end infinite;
  }

  .insert-marker-before::before {
    content: "";
    position: absolute;
    left: -2px;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: #999;
  }

  @keyframes cursor-blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }

  .line:has(.cursor-normal, .cursor-edit) .line-content {
    background-color: rgba(100, 100, 100, 0.1);
  }

  .char:empty::before {
    content: " ";
    white-space: pre;
  }
</style>
