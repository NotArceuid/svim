import type { Editor } from "../Editor.svelte.ts";
import type { Vector2 } from "../Structs/Vector2.svelte.ts";
import { EditorStateEnum, type IEditorModes } from "./EditorModes.ts";

export class VisualMode implements IEditorModes {
  _editor: Editor;

  public VisualBufferStart: Vector2 = { x: 0, y: 0 };
  public VisualBufferEnd: Vector2 = { x: 0, y: 0 };

  public Tracking: boolean = false;
  constructor(editor: Editor) {
    this._editor = editor;
  }

  public start_track() {
    this.Tracking = true;
    this._editor.State = EditorStateEnum.VISUAL;
    this.VisualBufferStart = { x: this._editor.LinePos, y: this._editor.CursorPos };
  }

  public end_track(): Vector2 {
    this.Tracking = false;
    this._editor.State = EditorStateEnum.VISUAL;
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

    this._editor.State = EditorStateEnum.VISUAL;
  }
}
