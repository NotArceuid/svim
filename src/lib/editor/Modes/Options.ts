import type { Editor } from "../Editor.svelte.ts";
import type { Vector2 } from "../Structs/Vector2.svelte.ts";
import { EditorStateEnum, type IEditorModes } from "./EditorModes.ts";
import type { InsertMode } from "./Insert.svelte.ts";
import type { NormalMode } from "./Normal.ts";
import type { VisualMode } from "./Visual.svelte.ts";

export class OptionMode implements IEditorModes {
  private _editor: Editor;
  private _insert: InsertMode;
  private _normalInputMap: Map<string, () => void>;
  private _visual: VisualMode;
  private _normal: NormalMode;
  public OptionText?: string[];
  constructor(editor: Editor, normal: NormalMode, insert: InsertMode, visual: VisualMode, normalInputMap: Map<string, () => void>) {
    this._editor = editor;
    this._normal = normal;
    this._insert = insert;
    this._visual = visual;
    this._normalInputMap = normalInputMap;
  }

  public SelectionStage: number = 0;
  public start_options(type: string) {
    this.OptionText = [type];
  }

  public fire_motion() {
    if (!this.OptionText) return;
    const type = this.OptionText[0];
    let succed = false;
    switch (type) {
      case 'd':
        succed = this.HandleDelete(this.OptionText);
        break;
      case 'c':
        succed = this.HandleChange(this.OptionText);
        break;
      case 'y':
        succed = this.HandleYank(this.OptionText);
        break;
    }
  }

  private HandleYank(motion: string[]): boolean {
    if (motion[1] === 'y') {
      this._visual.start_track();
      this.get_motion('0');
      this._visual.end_track();
      this._visual.start_track();
      this.get_motion('$', true);
      this._visual.yank();
      this._visual.end_track();
      this.OptionText = undefined;
      return true;
    }
    this._visual.start_track();
    if (!this.get_motion(motion[1]))
      return false;

    this._visual.yank();
    this._visual.end_track();
    this.OptionText = undefined;
    return true;
  }

  private HandleChange(motion: string[]): boolean {
    if (motion[1] === 'c') {
      this._visual.start_track();
      this.get_motion('0');
      this._visual.end_track();
      this._visual.start_track();
      this.get_motion('$', true);
      this._visual.delete();
      this._insert.insert_start();
      this.OptionText = undefined;
      return true;
    }
    this._visual.start_track();
    if (!this.get_motion(motion[1]))
      return false;

    this._visual.delete();
    this._visual.end_track();
    this._insert.insert_start();
    this.OptionText = undefined;
    return true;
  }

  private HandleDelete(motion: string[]): boolean {
    if (motion[1] === 'd') {
      this.cursor_pos_cache = this._editor.CursorPos;
      this.get_motion('0');
      this._visual.start_track();
      this.get_motion('$', true);
      this._visual.delete();

      this._normal.SetCursorPosRef(this.cursor_pos_cache);
      this._visual.end_track();
      this.OptionText = undefined;
      this.cursor_pos_cache = 0;
      return true;
    }

    this._visual.start_track();
    if (!this.get_motion(motion[1]))
      return false;

    this._visual.delete();
    this._visual.end_track();
    this.OptionText = undefined;
    return true;
  }
  private cursor_pos_cache: number = 0;
  public get_motion(key: string, off_one = false): boolean {
    const func = this._normalInputMap.get(key);
    this._editor.State = EditorStateEnum.NORMAL;
    if (!func) {
      const clear_buffer = this._normalInputMap.get("Escape");
      clear_buffer!();
      return false;
    }
    let diff: Vector2 = {
      x: this._editor.CursorPos - (off_one ? 0 : -1),
      y: this._editor.LinePos
    }
    func();

    this._visual.update_buffer({
      x: this._editor.CursorPos - diff.x,
      y: this._editor.LinePos - diff.y
    });
    return true;
  }
}
