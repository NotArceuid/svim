import { type Editor } from "../Editor.svelte.ts";
import { Settings } from "../Settings.ts";
import { BufferTypeEnum, GapBuffer } from "../Structs/GapBuffer.svelte.ts";
import type { LinkedListNode } from "../Structs/LinkedList.svelte.ts";
import type { Vector2, VisualBufferRange } from "../Structs/Vector2.svelte.ts";
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
      const new_text = text.value.Span.slice(range.start.x, range.end.x + 1);
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

  public delete(): void {
    const range = this._editor.GetVisualBufferRange();
    const text = this._editor.Text.elementAtPos(Math.min(range.start.y, range.end.y))!;
    const copied_text = { val: "" };

    range.start.y === range.end.y ?
      this.delete_within(text, range, copied_text) :
      this.delete_multiline(range, text, copied_text);

    if (Settings.SaveToClipboard)
      navigator.clipboard.writeText(copied_text.val);

    this._editor.TextBuffer = copied_text.val;
    this._editor.CursorPos = this._editor.LinePos > this.VisualBufferStart.y ? this.VisualBufferStart.x : this.VisualBufferEnd.x;
    this._editor.LinePos = this._editor.LinePos > this.VisualBufferStart.y ? this.VisualBufferStart.y : this.VisualBufferEnd.y;
    this._editor.State = EditorStateEnum.NORMAL;
  }

  private delete_multiline(range: VisualBufferRange, text: LinkedListNode<GapBuffer>, copied_text: { val: string }): void {
    const first = text;
    let iter = range.start.y;

    while (text.next) {
      if (iter === range.start.y) {
        text.value.CreateBufferAt(range.start.x, BufferTypeEnum.SPLITLEFT);
        copied_text.val += text.value.BufferRight;
        text.value.UpdateBufferText("");
        text.value.SaveBuffer();
      }
      else if (iter === range.end.y) {
        text.value.CreateBufferAt(range.end.x + 1, BufferTypeEnum.SPLITRIGHT);
        copied_text.val += text.value.ActiveZone;
        text.value.UpdateActiveZone("");

        first.value.CreateBufferAt(range.start.x, BufferTypeEnum.SPLITLEFT);
        first.value.UpdateBufferText(text.value.BufferLeft ?? "");
        first.value.SaveBuffer();

        text.delete();
        break;
      } else {
        copied_text.val += text.value.Span;
        text.delete();
        this._editor.CurrentLine = this._editor.CurrentLine?.next?.next!;
      }

      text = text.next;
      iter++;
    }
  }

  private delete_within(text: LinkedListNode<GapBuffer>, range: VisualBufferRange, copied_text: { val: string }): void {
    text.value.CreateBufferRegion(range.start.x, range.end.x + 1);
    copied_text.val += text.value.ActiveZone;
    text.value.UpdateActiveZone("");
    text.value.SaveBuffer();
  }

  public undo_delete() {

  }
}
