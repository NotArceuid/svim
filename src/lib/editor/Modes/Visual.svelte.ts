import type { Editor } from "../Editor.svelte.ts";
import { GapBuffer } from "../Structs/GapBuffer.svelte.js";
import { LinkedList, LinkedListNode } from "../Structs/LinkedList.svelte.ts";
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
    const start_y = Math.min(this.VisualBufferStart.y, this.VisualBufferEnd.y);
    const end_y = Math.max(this.VisualBufferStart.y, this.VisualBufferEnd.y);
    const start_x =
      this._editor.VisualBufferStart.y < this._editor.VisualBufferEnd.y ||
        (this._editor.VisualBufferStart.y === this._editor.VisualBufferEnd.y &&
          this._editor.VisualBufferStart.x < this._editor.VisualBufferEnd.x)
        ? this._editor.VisualBufferStart.x
        : this._editor.VisualBufferEnd.x;
    const end_x =
      this._editor.VisualBufferStart.y < this._editor.VisualBufferEnd.y ||
        (this._editor.VisualBufferStart.y === this._editor.VisualBufferEnd.y &&
          this._editor.VisualBufferStart.x < this._editor.VisualBufferEnd.x)
        ? this._editor.VisualBufferEnd.x
        : this._editor.VisualBufferStart.x;

    this._editor.TextBuffer = new LinkedList<GapBuffer>();
    let text = this._editor.Text.elementAtPos(start_y);
    for (let i = 0; i < end_y; i++) {
      if (!text) {
        break;
      }

      let lines = text.value.Span.split(/(?<=\n)/);
      lines.forEach((line, idx) => {
        let buff_line = new GapBuffer(line);
        if (idx === 0) {
          buff_line.Span = buff_line.Span.slice(0, end_x);
        }
        else if (idx === end_y - 1) {
          buff_line.Span = buff_line.Span.slice(start_x, buff_line.Span.length);
        }

        this._editor.TextBuffer!.append(buff_line);
      })

      if (text?.next) {
        text = text?.next;
      }
    }

    this._editor.CursorPos = this._cursor_pos_cache.x;
    this._editor.LinePos = this._cursor_pos_cache.y;

    this.clear_buffer();
    this.end_track();

    this._editor.State = EditorStateEnum.NORMAL;
  }

  public get_text_from_buf() {

  }
}
