import { TextEditor, type Editor } from "../Editor.svelte.ts";
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
    const [start_y, end_y] = [
      Math.min(this._editor.VisualBufferStart.y, this._editor.VisualBufferEnd.y),
      Math.max(this._editor.VisualBufferStart.y, this._editor.VisualBufferEnd.y),
    ];

    const [start_x, end_x] =
      start_y === this._editor.VisualBufferStart.y
        ? [this._editor.VisualBufferStart.x, this._editor.VisualBufferEnd.x]
        : [this._editor.VisualBufferEnd.x, this._editor.VisualBufferStart.x];

    this._editor.TextBuffer = new LinkedList<GapBuffer>();
    let text = this._editor.Text.elementAtPos(Math.min(start_y, end_y))!;
    if (start_y === end_y) {
      this.yank_single(text, start_x, end_x);
    } else {
      this.yank_multiline(text, start_x, end_x, start_y, end_y);
    }

    this._editor.CursorPos = this._cursor_pos_cache.x;
    this._editor.LinePos = this._cursor_pos_cache.y;

    this.clear_buffer();
    this._editor.State = EditorStateEnum.NORMAL;
    let node = this._editor.TextBuffer.head;
    while (node?.next) {
      node = node.next;
    }
  }

  private yank_multiline(text: LinkedListNode<GapBuffer>, start_x: number, end_x: number, start_y: number, end_y: number) {
    let iter = 0;
    while (text.next) {
      let buff_line = new GapBuffer(text.value.Span);
      if (iter === 0) {
        buff_line.Span = buff_line.Span.slice(start_x, buff_line.Span.length);
      }
      else if (iter === end_y) {
        buff_line.Span = buff_line.Span.slice(0, end_x + 1);
      }

      this._editor.TextBuffer!.append(buff_line);
      if (iter === end_y) {
        break;
      }

      text = text.next
      iter++;
    }
  }

  private yank_single(text: LinkedListNode<GapBuffer>, start_x: number, end_x: number) {
    const new_text = text.value.Span.slice(start_x, end_x);
    this._editor.TextBuffer?.append(new GapBuffer(new_text));
  }

  public delete() {

  }
}
