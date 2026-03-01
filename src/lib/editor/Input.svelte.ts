import { TextEditor, type Editor } from "./Editor.svelte.ts";
import { EditorStateEnum } from "./Modes/EditorModes.ts";
import { InsertMode } from "./Modes/Insert.ts";
import { NormalMode } from "./Modes/Normal.ts";
import { VisualMode } from "./Modes/Visual.svelte.ts";
import type { Vector2 } from "./Structs/Vector2.svelte.ts";

export class InputMapper {
  public Normal: NormalMode;
  public Insert: InsertMode;
  public Visual: VisualMode;

  private _inputBuffer: string = $state("");
  private set InputBuffer(val) {
    this._inputBuffer = val;
  }

  get InputBuffer(): string {
    return this._inputBuffer
  }

  private NormalInputMap = new Map<string, () => void>();
  private VisualInputMap = new Map<string, () => void>();
  private InsertInputMap = new Map<string, () => void>();
  private CurrentInputMap = this.NormalInputMap;
  constructor(editor: Editor) {
    this.Normal = new NormalMode(editor);
    this.Insert = new InsertMode(editor);
    this.Visual = new VisualMode(editor);

    // lol
    this.set("n", "h", () => this.Normal.left());
    this.set("n", "j", () => this.Normal.down());
    this.set("n", "k", () => this.Normal.up());
    this.set("n", "l", () => this.Normal.right());
    this.set("n", "ArrowLeft", () => this.Normal.left());
    this.set("n", "ArrowDown", () => this.Normal.down());
    this.set("n", "ArrowUp", () => this.Normal.up());
    this.set("n", "ArrowRight", () => this.Normal.right());
    this.set("n", "$", () => this.Normal.end_line());
    this.set("n", "0", () => this.Normal.start_line());
    this.set("n", "^", () => this.Normal.nonwhitespace_start_line());
    this.set("n", "{", () => this.Normal.jump_up_paragraph());
    this.set("n", "}", () => this.Normal.jump_down_paragraph());
    this.set("n", "w", () => this.Normal.go_word(true, true));
    this.set("n", "e", () => this.Normal.go_word(false, true));
    this.set("n", "W", () => this.Normal.go_word(true, false));
    this.set("n", "E", () => this.Normal.go_word(false, false));
    this.set("n", "b", () => this.Normal.go_back_word(true, true));
    this.set("n", "ge", () => this.Normal.go_back_word(false, true));
    this.set("n", "B", () => this.Normal.go_back_word(true, false));
    this.set("n", "gE", () => this.Normal.go_back_word(false, false));
    this.set("n", "G", () => this.Normal.go_bottom());
    this.set("n", "gg", () => this.Normal.go_top());
    this.set("n", "f", () => this.Normal.find());
    this.set("n", ";", () => this.Normal.next());
    this.set("n", ",", () => this.Normal.prev());
    this.set("n", "O", () => this.Insert.insert_line_above())
    this.set("n", "o", () => this.Insert.insert_line_below())
    this.set("n", "i", () => this.Insert.insert_start());
    this.set("n", "a", () => this.Insert.insert_end());
    this.set("n", "Escape", () => this.Normal.switch_normal());
    this.set("n", "u", () => this.Normal.undo());
    this.set("n", "p", () => this.Normal.paste());
    this.set("n", "Control r", () => this.Normal.redo());
    this.set("i", "i", () => this.Insert.insert_start())
    this.set("i", "I", () => this.Insert.insert_start_line())
    this.set("i", "a", () => this.Insert.insert_end())
    this.set("i", "A", () => this.Insert.insert_end_line())
    this.set("i", "ArrowLeft", () => this.Normal.left());
    this.set("i", "ArrowDown", () => this.Normal.down());
    this.set("i", "ArrowUp", () => this.Normal.up());
    this.set("i", "ArrowRight", () => this.Normal.right());
    this.set("i", "~", () => this.Insert.switch_case());
    this.set("i", "Escape", () => this.Normal.switch_normal());

    this.set("v", "Escape", () => {
      this.Visual.clear_buffer();
      this.Visual.end_track()
    });

    this.set("n", "v", () => this.Visual.start_track());
    this.set("v", "y", () => this.Visual.yank())

    // Yank LIne
    this.set("n", "yy", () => {
      this.Normal.start_line();
      this.Visual.start_track();
      this.Normal.end_line();
      this.Visual.update_buffer({ x: TextEditor.CursorPos, y: 0 });
      this.Visual.yank();
      this.Visual.end_track();
    });

    editor.EditorStateEvent.Add((state) => {
      switch (state) {
        case EditorStateEnum.NORMAL:
          this.CurrentInputMap = this.NormalInputMap;
          break;
        case EditorStateEnum.INSERT:
          this.CurrentInputMap = this.InsertInputMap;
          break;
        case EditorStateEnum.VISUAL:
          this.CurrentInputMap = this.VisualInputMap;
          break;
      }
    })
  }

  // similar to nvim
  public set(mode: string, key: string, action: () => void) {
    switch (mode) {
      case 'n':
        this.NormalInputMap.set(key, action);
        break;
      case 'i':
        this.InsertInputMap.set(key, action);
        break;
      case 'v':
        this.VisualInputMap.set(key, action);
        break;
      case ' ':
        console.log("not implemented lol")
        break;
      case 't':
        console.log("not implemented lol")
        break;
    }
  }

  public MapInput(key: string) {
    this.InputBuffer = this.InputBuffer + key;

    if (key === "Escape") {
      this.InputBuffer = "";
      let switch_modes = this.CurrentInputMap.get("Escape");
      switch_modes?.();
    }

    switch (TextEditor.State) {
      case EditorStateEnum.NORMAL:
        if (!this.HandleNormalMode(key)) return;
        break;
      case EditorStateEnum.INSERT:
        if (this.HandleInsertMode(key)) return;
        break;
      case EditorStateEnum.VISUAL:
        if (this.HandleVisualMode(key)) return;
        break;
      case EditorStateEnum.COMMAND:
        break;

    }
  }

  private HandleNormalMode(key: string): boolean {
    if (this.Normal.IsFinding) {
      if (key === ";" || key === ",") {
        this.Normal.stop_find();
      }
    } else {
      this.Normal.stop_find();
    }

    if (this.InputBuffer === "0") {
      let val = this.NormalInputMap.get("0");
      val?.();
      this.InputBuffer = "";
      return false;
    }

    if (!key.match("[0-9]")) {
      let diff = this.TryMultiAction();
      if (this.Visual.Tracking)
        this.Visual.update_buffer(diff);
    }

    return true;
  }

  private HandleInsertMode(key: string): boolean {
    this.Insert.update_ln_buffer(key);
    return true;
  }

  private HandleVisualMode(key: string): boolean {
    let action = this.CurrentInputMap.get(key);
    action?.();

    if (this.Visual.Tracking) {
      this.HandleNormalMode(key);
    }

    return true;
  }

  // Here using normal input map since multi action can occur with normal mode related actions only
  private TryMultiAction(): Vector2 {
    let count = this.InputBuffer.match("[0-9]*");

    let cursor_dif: Vector2 = {
      x: TextEditor.CursorPos,
      y: TextEditor.LinePos
    }

    if (count?.[0] === "") {
      let func = this.NormalInputMap.get(this.InputBuffer);
      if (func) {
        func();
        cursor_dif.x = TextEditor.CursorPos - cursor_dif.x;
        cursor_dif.y = TextEditor.LinePos - cursor_dif.y;

        this.InputBuffer = "";
      }
    } else if (count) {
      let char = this.InputBuffer.slice(count[0]?.length, this.InputBuffer.length);
      let func = this.NormalInputMap.get(char);
      if (func) {
        for (let i = 0; i < Number(count[0]); i++) {
          func();

          cursor_dif.x = TextEditor.CursorPos - cursor_dif.x;
          cursor_dif.y = TextEditor.LinePos - cursor_dif.y;
        }
      }

      this.InputBuffer = "";
    }

    return cursor_dif;
  }
}
