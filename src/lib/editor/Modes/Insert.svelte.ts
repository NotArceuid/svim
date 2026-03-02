import { Editor } from "../Editor.svelte.ts";
import { Settings } from "../Settings.ts";
import { GapBuffer } from "../Structs/GapBuffer.svelte.ts";
import { LinkedListNode } from "../Structs/LinkedList.svelte.ts";
import { EditorStateEnum, type IEditorModes } from "./EditorModes.ts";

export class InsertMode implements IEditorModes {
  private _editor: Editor;
  constructor(editor: Editor) {
    this._editor = editor;
  }

  // o
  public insert_line_below() {
    let curr_line = this._editor.CurrentLine;
    let whitespace_count = 0;
    for (let i = 0; i < (curr_line?.value.Span.length ?? 0); i++) {
      if (curr_line?.value.Span[i] === " ") {
        continue;
      }

      whitespace_count = i;
      break;
    }

    let node = new LinkedListNode(new GapBuffer(this.get_indentation_spaces().repeat(whitespace_count == 0 ? 1 : whitespace_count) + "\n"));
    curr_line?.insert_next(node);
    this._editor.LinePos++;
    this._editor.CursorPos = Math.max(node.value.Span.length - 1, 0);
    this.insert_start()
  }

  public undo_insert_line_below() {

  }

  // O
  public insert_line_above() {
    let curr_line = this._editor.CurrentLine;
    let whitespace_count = 0;
    for (let i = 0; i < (curr_line?.value.Span.length ?? 0); i++) {
      if (curr_line?.value.Span[i] === " ") {
        continue;
      }

      whitespace_count = i;
      break;
    }

    let node = new LinkedListNode(new GapBuffer(this.get_indentation_spaces().repeat(whitespace_count == 0 ? 1 : whitespace_count) + "\n"));
    curr_line?.insert_prev(node);
    this._editor.CursorPos = Math.max(node.value.Span.length - 1, 0);
    this._editor.CurrentLine = this._editor.CurrentLine?.prev ?? null;

    this.insert_start()
  }

  public undo_insert_line_above() {

  }

  // i
  public insert_start() {
    if (this._editor.State != EditorStateEnum.INSERT) {
      this._editor.State = EditorStateEnum.INSERT;
      this._editor.InsertBefore = true;
    }

    this._editor.CurrentLine?.value.CreateBufferAt(this._editor.CursorPos);
  }

  // a
  public insert_end() {
    if (this._editor.State != EditorStateEnum.INSERT) {
      this._editor.State = EditorStateEnum.INSERT;
      this._editor.InsertBefore = false;
    }

    this._editor.CurrentLine?.value.CreateBufferAt(this._editor.CursorPos + 1);
  }

  // I
  public insert_start_line() {
    if (this._editor.State != EditorStateEnum.INSERT) {
      this._editor.State = EditorStateEnum.INSERT;
    }
  }

  // A
  public insert_end_line() {
    if (this._editor.State != EditorStateEnum.INSERT) {
      this._editor.State = EditorStateEnum.INSERT;
    }
  }

  public switch_case() {
    let range = this._editor.GetVisualBufferRange();

  }

  public to_upper() {
    this._editor.CurrentLine?.value.Span[this._editor.CursorPos].toUpperCase();
  }

  public to_lower() {
    this._editor.CurrentLine?.value.Span[this._editor.CursorPos].toUpperCase();
  }

  public update_ln_buffer(key: string) {
    if (!this._editor.CurrentLine)
      return;

    switch (key) {
      case "Backspace":
        this.backspace();
        break;
      case "Enter":
        this.enter();
        break;
      case "Tab":
        this._editor.CurrentLine.value.ActiveZone! += this.get_indentation_spaces();
        if (this._editor.InsertBefore)
          this._editor.CursorPos = this._editor.CurrentLine.value.ActiveZone!.length;
        else
          this._editor.CursorPos = this._editor.CurrentLine.value.ActiveZone!.length - 1;
        break;
      default:
        this._editor.CurrentLine.value.ActiveZone! += key;
        if (this._editor.InsertBefore)
          this._editor.CursorPos = this._editor.CurrentLine.value.ActiveZone!.length;
        else
          this._editor.CursorPos = this._editor.CurrentLine.value.ActiveZone!.length - 1;
        break;
    }
  }

  private backspace() {
    if (!this._editor.CurrentLine)
      return;

    if (this._editor.CursorPos === 0) {
      let ln_text = this._editor.CurrentLine.value.Span;
      let prev_len = (this._editor.CurrentLine!.prev?.value.Span.length ?? 0) - 1;

      let prev = this._editor.CurrentLine.prev;
      if (prev) {
        prev.value.CreateBufferAt(prev.value.Span.length - 1, true);
        prev.value.BufferRight = "";
        prev.value.UpdateActiveZone(prev.value.ActiveZone + ln_text)
        prev.value.Span = prev.value.Span.replace("\n", "");
        prev.value.SaveBuffer();
      }

      this._editor.CursorPos = prev_len;
      this._editor.CurrentLine.delete();
      this._editor.LinePos--;

      return;
    }

    if (this._editor.CurrentLine.value.ActiveZone) {
      this._editor.CurrentLine.value.UpdateActiveZone(this._editor.CurrentLine.value.ActiveZone.slice(0, -1))
      this._editor.CursorPos--;
    }
  }

  public undo_backspace() {

  }

  private enter() {
    if (!this._editor.CurrentLine) {
      return;
    }

    const before = this._editor.InsertBefore;
    const str = this._editor.CurrentLine.value.Span.slice(this._editor.CursorPos + (before ? 0 : 1), this._editor.CurrentLine.value.Span.length - 1);
    const end = this._editor.CurrentLine.value.Span.slice(0, this._editor.CursorPos + (before ? 0 : 1));
    this._editor.CurrentLine.value.Span = end;

    // Workaround, these 2 lines made it work, don't touch it
    this._editor.CurrentLine.value.CreateBufferAt(0);
    this._editor.CurrentLine.value.SaveBuffer();

    let whitespace_count = 0;
    const curr_line = this._editor.CurrentLine;
    for (let i = 0; i < curr_line.value.Span.length; i++) {
      if (curr_line?.value.Span[i] === " ") {
        continue;
      }

      whitespace_count = i;
      break;
    }

    const new_node = new LinkedListNode<GapBuffer>(new GapBuffer(this.get_indentation_spaces().repeat(whitespace_count) + str));
    this._editor.CurrentLine?.insert_next(new_node);
    this._editor.CursorPos = whitespace_count;
    this._editor.InsertBefore = true;
    this._editor.LinePos++;
  }

  public undo_enter() {

  }

  private get_indentation_spaces(): string {
    return " ".repeat(Settings.IndentationSize);
  }
}
