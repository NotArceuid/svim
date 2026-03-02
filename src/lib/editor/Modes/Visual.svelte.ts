import { type Editor } from "../Editor.svelte.ts";
import { Settings } from "../Settings.ts";
import type { Vector2 } from "../Structs/Vector2.svelte.ts";
import { EditorStateEnum, type IEditorModes } from "./EditorModes.ts";

export class VisualMode implements IEditorModes {
  _editor: Editor;

  public VisualBufferStart: Vector2 = $state({ x: 0, y: 0 });
  public VisualBufferEnd: Vector2 = $state({ x: 0, y: 0 });

  public Tracking: boolean = false;
  constructor(editor: Editor) {
    this._editor = editor;
  }

  private _cursor_pos_cache: Vector2 = { x: 0, y: 0 };
  public start_track() {
    this.Tracking = true;
    this._editor.State = EditorStateEnum.VISUAL;

    this.VisualBufferStart = { x: this._editor.CursorPos, y: this._editor.LinePos };
    this.VisualBufferEnd = { x: this._editor.CursorPos, y: this._editor.LinePos };
    this._cursor_pos_cache = { x: this._editor.CursorPos, y: this._editor.LinePos };
  }

  public end_track(): Vector2 {
    this.Tracking = false;
    this._editor.State = EditorStateEnum.NORMAL;
    return {
      x: this.VisualBufferEnd.x - this.VisualBufferStart.x,
      y: this.VisualBufferEnd.y - this.VisualBufferStart.y,
    }
  }

  public update_buffer(diff: Vector2) {
    this.VisualBufferEnd.x += diff.x;
    this.VisualBufferEnd.y += diff.y;
  }

  /*
  * This function clears the visual buffer
  */
  public clear_buffer() {
    this.Tracking = false;

    this.VisualBufferStart = { x: 0, y: 0 };
    this.VisualBufferEnd = { x: 0, y: 0 };
  }

  public yank() {
    let range = this._editor.GetVisualBufferRange();
    let text = this._editor.Text.elementAtPos(Math.min(range.start.y, range.end.y))!;

    let copied_text = "";
    if (range.start.y === range.end.y) {
      const new_text = text.value.Span.slice(range.start.x, range.end.x);
      copied_text += new_text;
    } else {
      let iter = range.start.y;
      while (text.next) {
        let buff_line = text.value.Span;
        if (iter === range.start.y) {
          buff_line = buff_line.slice(range.start.x, buff_line.length);
          copied_text += buff_line;
        }
        else if (iter === range.end.y) {
          buff_line = buff_line.slice(0, range.end.x + 1);
          copied_text += buff_line;
          break;
        } else {
          copied_text += buff_line;
        }

        text = text.next
        iter++;
      }
    }

    if (Settings.SaveToClipboard)
      navigator.clipboard.writeText(copied_text);

    this._editor.TextBuffer = copied_text;
    this._editor.CursorPos = this._cursor_pos_cache.x;
    this._editor.LinePos = this._cursor_pos_cache.y;

    this.clear_buffer();
    this._editor.State = EditorStateEnum.NORMAL;
  }

  public delete() {
    let range = this._editor.GetVisualBufferRange();
    let text = this._editor.Text.elementAtPos(Math.min(range.start.y, range.end.y))!;
    let copied_text = "";
    let multi_edit = false;
    if (range.start.y === range.end.y) {
      text.value.CreateBufferRegion(range.start.x, range.end.x);
      text.value.UpdateActiveZone("");

      if (text.value.Span.slice(-1) === "\n") {
        console.log("w")
      }

      text.value.SaveBuffer();
    } else {
      let iter = range.start.y;
      while (text.next) {
        if (iter === range.start.y) {
          const slice = text.value.Span.slice(range.start.x, text.value.Span.length);
          copied_text += slice;
          text.value.Span = text.value.Span.slice(0, range.start.x);
        }
        else if (iter === range.end.y) {
          const slice = text.value.Span.slice(0, range.end.x + 1);
          copied_text += slice;
          text.value.Span = text.value.Span.slice(range.end.x + 1, text.value.Span.length);

          break;
        } else {
          copied_text += text.value;
          text.delete();
        }

        text = text.next
        iter++;
        multi_edit = true;
      }
    }

    if (Settings.SaveToClipboard)
      navigator.clipboard.writeText(copied_text);

    this._editor.TextBuffer = copied_text;

    this._editor.CursorPos = this._cursor_pos_cache.x;
    this._editor.LinePos = this._cursor_pos_cache.y;
    this._editor.State = EditorStateEnum.NORMAL;

    if (multi_edit) {

    }
  }

  public undo_delete() {

  }
}
