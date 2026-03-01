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

    let node = new LinkedListNode(new GapBuffer(this.get_indentation_spaces().repeat(whitespace_count == 0 ? 1 : whitespace_count)));
    curr_line?.insert_next(node);
    this._editor.LinePos++;
    this._editor.CursorPos = Math.max(node.value.Span.length - 1, 0);
    this.insert_start()
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

    let node = new LinkedListNode(new GapBuffer(this.get_indentation_spaces().repeat(whitespace_count == 0 ? 1 : whitespace_count)));
    curr_line?.insert_prev(node);
    this._editor.CursorPos = Math.max(node.value.Span.length - 1, 0);
    this._editor.LinePos = this._editor.LinePos;
    this._editor.CurrentLine = this._editor.CurrentLine?.prev ?? null;

    this.insert_start()
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

  // x
  public delete_char() {

  }

  public switch_case() {

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
        if (this._editor.CurrentLine.value.ActiveZone)
          this._editor.CurrentLine.value.ActiveZone = this._editor.CurrentLine.value.ActiveZone.slice(0, -1);
        break;
      case "Tab":
        this._editor.CurrentLine.value.ActiveZone += this.get_indentation_spaces();
        break;
      default:
        this._editor.CurrentLine.value.ActiveZone += key;
        break;
    }

    if (this._editor.InsertBefore)
      this._editor.CursorPos = this._editor.CurrentLine.value.ActiveZone!.length;
    else
      this._editor.CursorPos = this._editor.CurrentLine.value.ActiveZone!.length - 1;
  }

  private get_indentation_spaces(): string {
    return " ".repeat(Settings.IndentationSize);
  }
}
