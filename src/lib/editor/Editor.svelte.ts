import { InputMapper } from "./Input.svelte.ts";
import { EditorStateEnum } from "./Modes/EditorModes.ts";
import { GapBuffer } from "./Structs/GapBuffer.svelte.ts";
import { LinkedList, LinkedListNode } from "./Structs/LinkedList.svelte.ts";
import { Observer } from "./Structs/Observer.svelte.ts";

export class Editor {
  public Text = $state(new LinkedList<GapBuffer>());
  public TextBuffer: LinkedList<GapBuffer> | null = $state(null);

  public UndoStack: undefined;
  public CurrentLine: LinkedListNode<GapBuffer> | null;
  public CursorPos: number = $state(0);
  private _linePos = $state(0);
  public get LinePos() {
    return this._linePos;
  }

  public set LinePos(val: number) {
    let num_diff = val - this.LinePos;
    for (let i = 0; i < Math.abs(this.LinePos - val); i++) {
      if (!this.CurrentLine)
        return;

      if (num_diff < 0) {
        this.CurrentLine = this.CurrentLine.prev;
      } else {
        this.CurrentLine = this.CurrentLine.next;
      }
    }

    this._linePos = val;
  }

  public get VisualBufferStart() {
    return this._inputMapper.Visual.VisualBufferStart;
  }
  public get VisualBufferEnd() {
    return this._inputMapper.Visual.VisualBufferEnd;
  }

  private _inputMapper: InputMapper;
  constructor(text: string) {
    let lines = text.split(/(?<=\n)/);
    lines.forEach((line) => {
      let buff_line = new GapBuffer(line);
      this.Text.append(buff_line);
    });

    this.CurrentLine = $state(this.Text.head);
    this._inputMapper = new InputMapper(this)
  }

  public EditorStateEvent: Observer<EditorStateEnum, void> = new Observer<EditorStateEnum, void>();
  private _state: EditorStateEnum = $state(EditorStateEnum.NORMAL);
  set State(value) {
    this._state = value;
    this.EditorStateEvent.Invoke(value);
  }

  public InsertBefore: boolean = false;
  get State() { return this._state; }

  private ModKeys = new Set(["Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock", "Meta", "NumLock", "ScrollLock", "Shift", "Symbol", "SymbolLock"]);
  public MapInput(ev: KeyboardEvent) {
    if (this.ModKeys.has(ev.key)) {
      return;
    }

    this._inputMapper.MapInput(ev.key);
  }

  get InputBuffer() {
    return this._inputMapper.InputBuffer;
  }
}

export const TextEditor = new Editor(`Lorem ipsum dolor sit amet adipiscing.
    this.InputMap.set("h", () => this.Normal.left());
    this.InputMap.set("j", () => this.Normal.down());
    this.InputMap.set("k", () => this.Normal.up());
    this.InputMap.set("l", () => this.Normal.right());
    this.InputMap.set("$", () => this.Normal.end_line());
    this.InputMap.set("0", () => this.Normal.start_line()); this.InputMap.set("w", () => this.Normal.go_start_word()); this.InputMap.set("e", () => this.Normal.go_end_word());
    this.InputMap.set("W", () => this.Normal.go_start_WORD());
    this.InputMap.set("E", () => this.Normal.go_end_WORD());
    this.InputMap.set("b", () => this.Normal.bStart());
    this.InputMap.set("ge", () => this.Normal.bEnd());
ekrjekrljwe`);
