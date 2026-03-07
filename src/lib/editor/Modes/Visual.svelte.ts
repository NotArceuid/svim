import { type Editor } from "../Editor.svelte.ts";
import { Settings } from "../Settings.ts";
import { BufferTypeEnum } from "../Structs/GapBuffer.svelte.ts";
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

  // holy fuck this took me so long to impleemnt
  public delete(): void {
    const range = this._editor.GetVisualBufferRange();
    const copied_text = { val: "" };

    range.start.y === range.end.y ?
      this.delete_within(range, copied_text) :
      this.delete_multiline(range, copied_text);

    if (Settings.SaveToClipboard)
      navigator.clipboard.writeText(copied_text.val);

    this._editor.TextBuffer = copied_text.val;
    this._editor.CursorPos = range.start.x < range.end.x ? range.start.x : range.end.x;
    this._editor.LinePos = this._editor.LinePos >= range.start.y ? range.start.y : range.end.y;

    if (this._editor.Text.elementAtPos(0)?.value.Span === "") {
      this._editor.Text.deleteHead();
      this._editor.CurrentLine = this._editor.Text.elementAtPos(this._editor.LinePos - 1)!;
    }

    this._editor.CurrentLine = this._editor.Text.elementAtPos(this._editor.LinePos)!;
    this._editor.State = EditorStateEnum.NORMAL;
  }

  private delete_multiline(range: VisualBufferRange, copied_text: { val: string }): void {
    const text = this._editor.Text.elementAtPos(Math.min(range.start.y, range.end.y))!;
    const is_head = text.value === this._editor.Text.elementAtPos(0)?.value!;

    const first = text;
    let curr_node = first.next!;
    first.value.CreateBufferAt(range.start.x, BufferTypeEnum.SPLITRIGHT);
    copied_text.val += first.value.ActiveZone;
    first.value.UpdateActiveZone("");
    first.value.SaveBuffer();

    for (let i = 1; i < range.end.y - range.start.y; i++) {
      copied_text.val += curr_node.value.Span;
      curr_node.delete();
      curr_node = curr_node.next!;
    }

    const last = curr_node;
    last.value.CreateBufferAt(range.end.x + 1, BufferTypeEnum.SPLITLEFT);
    const buffer_right = last.value.BufferRight;
    copied_text.val += last.value.ActiveZone;
    last.value.UpdateActiveZone("");

    first.value.CreateBufferAt(range.start.x, BufferTypeEnum.SPLITRIGHT);
    if (first.value.Span === '\n' && !is_head) {
      first.delete();
    } else {
      first.value.UpdateActiveZone(buffer_right === '' ? '\n' : buffer_right ?? '\n');
      first.value.SaveBuffer();

      if (is_head && range.start.x === 0)
        this._editor.Text.deleteHead();
    }

    last.value.SaveBuffer();
    if (range.start.x !== 0)
      last.delete();
  }


  private delete_within(range: VisualBufferRange, copied_text: { val: string }): void {
    let val = this._editor.Text.elementAtPos(Math.min(range.start.y, range.end.y))!;
    val.value.CreateBufferRegion(
      Math.min(range.start.x, range.end.x),
      Math.max(range.start.x, range.end.x) + 1
    );

    copied_text.val += val.value.ActiveZone;
    val.value.UpdateActiveZone("");
    val.value.SaveBuffer();
  }

  public undo_delete() {

  }

  public switch_case() {
    const range = this._editor.GetVisualBufferRange();
    range.start.y === range.end.y ? this.switch_case_within(range) : this.switch_case_multiline(range);

    this._editor.CursorPos = range.start.x < range.end.x ? range.start.x : range.end.x;
    this._editor.LinePos = this._editor.LinePos >= range.start.y ? range.start.y : range.end.y;

    if (this._editor.Text.elementAtPos(0)?.value.Span === "") {
      this._editor.Text.deleteHead();
      this._editor.CurrentLine = this._editor.Text.elementAtPos(this._editor.LinePos - 1)!;
    }

    this._editor.CurrentLine = this._editor.Text.elementAtPos(this._editor.LinePos)!;
    this._editor.State = EditorStateEnum.NORMAL;
  }

  private switch_case_within(range: VisualBufferRange) {
    let val = this._editor.Text.elementAtPos(Math.min(range.start.y, range.end.y))!;
    val.value.CreateBufferRegion(
      Math.min(range.start.x, range.end.x),
      Math.max(range.start.x, range.end.x) + 1
    );

    let text = { val: val.value.ActiveZone! };
    this.invert_cases(text);
    val.value.UpdateActiveZone(text.val);
    val.value.SaveBuffer();
  }

  private switch_case_multiline(range: VisualBufferRange) {
    const first = this._editor.Text.elementAtPos(range.start.y)!;
    let curr_node = first.next!;

    first.value.CreateBufferAt(range.start.x, BufferTypeEnum.SPLITRIGHT);
    let first_text = { val: first.value.ActiveZone! };
    this.invert_cases(first_text);
    first.value.UpdateActiveZone(first_text.val);
    first.value.SaveBuffer();

    for (let i = 1; i < range.end.y - range.start.y; i++) {
      curr_node.value.CreateBufferAt(0, BufferTypeEnum.SPLITRIGHT);
      let zone = { val: curr_node.value.ActiveZone! };
      this.invert_cases(zone);
      curr_node.value.UpdateActiveZone(zone.val);
      curr_node.value.SaveBuffer();

      curr_node = curr_node.next!;
    }

    const last = curr_node;
    last.value.CreateBufferAt(range.end.x + 1, BufferTypeEnum.SPLITLEFT);
    let last_text = { val: curr_node.value.ActiveZone! };
    this.invert_cases(last_text);
    last.value.UpdateActiveZone(last_text.val);
  }

  private invert_cases(text: { val: string }) {
    let result = '';
    for (const char of text.val) {
      result += char === char.toUpperCase()
        ? char.toLowerCase()
        : char.toUpperCase();
    }
    text.val = result;
  }
}
