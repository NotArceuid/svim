import type { Editor } from "../Editor.svelte.ts";
import type { InputMapper } from "../Input.svelte.ts";
import type { Vector2 } from "../Structs/Vector2.svelte.ts";
import { EditorStateEnum, type IEditorModes } from "./EditorModes.ts";
import type { InsertMode } from "./Insert.svelte.ts";
import type { NormalMode } from "./Normal.ts";
import type { VisualMode } from "./Visual.svelte.ts";

export class OptionMode implements IEditorModes {
  private _editor: Editor;
  private _normal: NormalMode;
  private _insert: InsertMode;
  private _normalInputMap: Map<string, () => void>;
  private _visual: VisualMode;
  public OptionText?: string[];
  constructor(editor: Editor, normal: NormalMode, insert: InsertMode, visual: VisualMode, normalInputMap: Map<string, () => void>) {
    this._editor = editor;
    this._normal = normal;
    this._insert = insert;
    this._visual = visual;
    this._normalInputMap = normalInputMap;
  }

  public IsSelectingMotion: boolean = false;
  public start_options(type: string) {
    this.OptionText = [type];
  }

  public fire_motion() {
    if (!this.OptionText)
      return;

    switch (this.OptionText[0]) {
      case 'd':
        this._visual.start_track();
        this.get_motion(this.OptionText![1]);
        this._visual.delete();
        this._editor.State = EditorStateEnum.NORMAL;
        this.OptionText = undefined;
        break;
      case 'c':
        this.get_motion(this.OptionText![1]);
        this._visual.delete();
        this._insert.insert_start();
        this.OptionText = undefined;
        break;
      case 'y':
        this.get_motion(this.OptionText![1]);
        this._visual.yank();
        this._editor.State = EditorStateEnum.NORMAL;
        this.OptionText = undefined;
        break;
    }
  }

  public get_motion(key: string) {
    const func = this._normalInputMap.get(key);

    this._editor.State = EditorStateEnum.NORMAL;
    if (!func) {
      const clear_buffer = this._normalInputMap.get("Escape");
      clear_buffer!();
    } else {
      func();
      let diff: Vector2 = {
        x: this._editor.CursorPos,
        y: this._editor.LinePos
      }
      this._visual.update_buffer(diff);
    }
  }
}
