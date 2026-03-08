import { type Editor } from "./Editor.svelte.ts";
import { Macros } from "./Macros.svelte.js";
import { EditorStateEnum } from "./Modes/EditorModes.ts";
import { InsertMode } from "./Modes/Insert.svelte.ts";
import { NormalMode } from "./Modes/Normal.ts";
import { OptionMode } from "./Modes/Options.ts";
import { VisualMode } from "./Modes/Visual.svelte.ts";
import type { Vector2 } from "./Structs/Vector2.svelte.ts";

export class InputMapper {
  public Normal: NormalMode;
  public Insert: InsertMode;
  public Visual: VisualMode;
  public Option: OptionMode;
  public Macros: Macros;

  private _inputBuffer: string = $state("");
  private _editor: Editor;
  public set InputBuffer(val) {
    this._inputBuffer = val;
  }

  get InputBuffer(): string {
    return this._inputBuffer
  }

  private NormalInputMap = new Map<string, () => void>();
  private VisualInputMap = new Map<string, () => void>();
  private InsertInputMap = new Map<string, () => void>();
  private OptionInputMap = new Map<string, () => void>();
  private CurrentInputMap = this.NormalInputMap;
  constructor(editor: Editor) {
    this._editor = editor;
    this.Normal = new NormalMode(editor);
    this.Insert = new InsertMode(editor);
    this.Visual = new VisualMode(editor);
    this.Option = new OptionMode(editor, this.Normal, this.Insert, this.Visual, this.NormalInputMap);
    this.Macros = new Macros(this);

    this.RegisterNormalMode();
    this.RegisterInputMode();
    this.RegisterVisualMode();
    this.RegisterOptionMods();

    editor.EditorStateEvent.Add((state) => {
      this.InputBuffer = "";
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
        case EditorStateEnum.OPTION:
          this.CurrentInputMap = this.OptionInputMap;
          break;
      }
    })
  }

  private RegisterVisualMode() {
    this.set("n", "v", () => this.Visual.start_track());
    this.set("v", "y", () => this.Visual.yank());
    this.set("v", "x", () => this.Visual.delete(true));
    this.set("v", "d", () => this.Visual.delete());
    this.set("v", "c", () => { this.Visual.delete(); this.Insert.insert_start() });
    this.set("v", "Escape", () => {
      this.Visual.clear_buffer();
      this.Visual.end_track();
      this.Macros.clear_macro();
    });
  }

  private RegisterNormalMode() {
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
    this.set("n", "G", () => { this.Normal.go_bottom(); });
    this.set("n", "gg", () => this.Normal.go_top());
    this.set("n", "f", () => this.Normal.find());
    this.set("n", "F", () => this.Normal.find_backwards());
    this.set("n", ";", () => this.Normal.next());
    this.set("n", ",", () => this.Normal.prev());
    this.set("n", "O", () => this.Insert.insert_line_above());
    this.set("n", "o", () => this.Insert.insert_line_below());
    this.set("n", "i", () => this.Insert.insert_start());
    this.set("n", "a", () => this.Insert.insert_end());
    this.set("n", "Escape", () => this.Normal.switch_normal());
    this.set("n", "u", () => this.Normal.undo());
    this.set("n", "Controlr", () => this.Normal.redo());
    this.set("n", "~", () => this.Visual.switch_case());
    this.set("n", "p", () => this.Normal.paste());
    this.set("n", "x", () => this.Normal.delete());
    this.set("n", "y", () => {

      this.Normal.start_line();
      this.Visual.start_track();
      this.Normal.end_line();
      this.Visual.update_buffer({ x: this._editor.CursorPos, y: 0 });
      this.Visual.yank();
      this.Visual.end_track();
    });
    this.set("n", "q", () => {
      if (this.Macros.ActiveMacro) {
        this.Macros.ActiveMacro.Value.pop();
        this.Macros.stop_record();
      } else {
        this.Macros.PrimeMacro();
      }
    });
  }

  private RegisterInputMode() {
    this.set("i", "i", () => this.Insert.insert_start());
    this.set("i", "I", () => this.Insert.insert_start_line());
    this.set("i", "a", () => this.Insert.insert_end());
    this.set("i", "A", () => this.Insert.insert_end_line());
    this.set("i", "ArrowLeft", () => this.Normal.left());
    this.set("i", "ArrowDown", () => this.Normal.down());
    this.set("i", "ArrowUp", () => this.Normal.up());
    this.set("i", "ArrowRight", () => this.Normal.right());
    this.set("i", "Escape", () => this.Normal.switch_normal());
  }

  private RegisterOptionMods() {
    this.set('o', "y", () => { this.InputBuffer = ""; { this.Option.start_options('y'); } });
    this.set('o', "d", () => { this.InputBuffer = ""; this.Option.start_options('d'); });
    this.set('o', "c", () => { this.InputBuffer = ""; this.Option.start_options('c'); });
  }

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
      case 'o':
        this.OptionInputMap.set(key, action);
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
      this.Macros.push(key);
      this.Normal.stop_find();
    }

    switch (this._editor.State) {
      case EditorStateEnum.NORMAL:
        this.HandleNormalMode(key);
        break;
      case EditorStateEnum.INSERT:
        this.HandleInsertMode(key)
        break;
      case EditorStateEnum.VISUAL:
        this.HandleVisualMode(key)
        break;
      case EditorStateEnum.OPTION:
        this.HandleOptionMode(key);
        break;
    }
  }

  private HandleInsertMode(key: string) {
    this.Insert.update_ln_buffer(key);
    if (this.Macros.ActiveMacro)
      this.Macros.push(key);
  }

  private HandleNormalMode(key: string) {
    if (this.TryFind(key)) return;
    if (this.TryMacro(key)) return;
    if (this.TryOption(key)) return;
    if (this.TryOverride0(key)) return;

    if (!key.match("[0-9]")) {
      let diff = this.TryMultiAction();
      if (this.Visual.Tracking)
        this.Visual.update_buffer(diff);
    }
  }

  private TryFind(key: string): boolean {
    if (this.Normal.IsFinding) {
      if (key === ";") {
        this.Normal.FindForwards ? this.Normal.next() : this.Normal.prev();
        this.InputBuffer = "";
        return true;
      }
      else if (key === ",") {
        this.Normal.FindForwards ? this.Normal.prev() : this.Normal.next();
        this.InputBuffer = "";
        return true;
      }
      else {
        this.Normal.FindChar = key;
        this.Normal.FindChar = this.Normal.FindChar.replace(/[.*+?^${}()|[\]\\]/, '\\$&');
        this.InputBuffer = "";
        this.Normal.FindForwards ? this.Normal.next() : this.Normal.prev();
        return true;
      }
    }
    else {
      this.Normal.stop_find();
    }

    return false;
  }

  private TryMacro(key: string): boolean {
    if (this.Macros.IsMacroPrimed) {
      if (!key.match(/^\w$/))
        return true;

      this.Macros.create_macro(key);
      this.InputBuffer = "";
      return true;
    }

    if (key === "@") {
      this.Macros.BeforePlay = true;
      return true;
    }

    return false;
  }

  private HandleOptionMode(key: string) {
    if (this.Option.OptionText?.[0]) {
      this.Option.OptionText.push(key);
      this.Macros.push(key);
      this.Option.fire_motion();
      // fire_motion clears OptionText when done — only exit OPTION when it's cleared
      if (!this.Option.OptionText) {
        this._editor.State = EditorStateEnum.NORMAL;
      }
      return;
    }

    const func = this.CurrentInputMap.get(key);
    if (!func) {
      this.InputBuffer = "";
      this._editor.State = EditorStateEnum.NORMAL;
      return;
    }

    func();
  }

  private TryOption(key: string): boolean {
    if ((key === 'd' || key === 'c' || key === 'y')
      && !this.Option.OptionText
      && this._editor.State === EditorStateEnum.NORMAL
      && !this.Visual.Tracking) {
      this.Macros.push(key); // record BEFORE state change
      this._editor.State = EditorStateEnum.OPTION;
      const func = this.CurrentInputMap.get(key);
      func?.();
      return true;
    }
    return false;
  }

  private TryOverride0(key: string): boolean {
    if (this.InputBuffer === "0") {
      let init_pos = this._editor.CursorPos;
      let val = this.NormalInputMap.get("0");
      val?.();
      this.InputBuffer = "";

      if (this._editor.State == EditorStateEnum.VISUAL) {
        this.Visual.update_buffer({ x: this._editor.CursorPos - init_pos, y: 0 });
      }

      this.Macros.push(key);
      return true;
    }

    return false;
  }

  private HandleVisualMode(key: string) {
    let action = this.CurrentInputMap.get(key);
    action?.();

    if (this.Visual.Tracking) {
      this.HandleNormalMode(key);
    }
  }


  private TryMultiAction(): Vector2 {
    const count = this.InputBuffer.match("[0-9]*");
    const cursor_dif: Vector2 = { x: this._editor.CursorPos, y: this._editor.LinePos };

    if (count?.[0] === "") {
      this.SingleAction();
    } else if (count) {
      this.MultiAction(count);
    }

    cursor_dif.x = this._editor.CursorPos - cursor_dif.x;
    cursor_dif.y = this._editor.LinePos - cursor_dif.y;
    return cursor_dif;
  }

  private SingleAction() {
    if (this.Macros.BeforePlay) {
      this.Macros.play_macro(this.InputBuffer.charAt(this.InputBuffer.length - 1));
      this.Macros.BeforePlay = false;
      this.InputBuffer = "";
      return;
    }

    const func = this.NormalInputMap.get(this.InputBuffer);
    if (func) {
      this.Macros.push(this.InputBuffer);
      func();
      this.InputBuffer = "";
    }
  }

  private MultiAction(count: string[]) {
    if (this.InputBuffer.endsWith('@')) return;

    const char = this.InputBuffer.slice(count[0].length);
    const n = Number(count[0]);

    if (this.Macros.BeforePlay) {
      const macroKey = this.InputBuffer.charAt(this.InputBuffer.length - 1);
      for (let i = 0; i < n; i++) {
        this.Macros.play_macro(macroKey);
      }
      this.Macros.BeforePlay = false;
      this.InputBuffer = "";
      return;
    }

    const func = this.NormalInputMap.get(char);
    if (func) {
      for (let i = 0; i < n; i++) {
        func();
      }
      this.Macros.push(this.InputBuffer);
    }

    this.InputBuffer = "";
  }
}
