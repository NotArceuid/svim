import { type Editor } from "../Editor.svelte.ts";
import { Settings } from "../Settings.ts";
import { BufferTypeEnum, GapBuffer } from "../Structs/GapBuffer.svelte.ts";
import { LinkedListNode } from "../Structs/LinkedList.svelte.ts";
import type { Vector2 } from "../Structs/Vector2.svelte.ts";
import { EditorStateEnum, type IEditorModes } from "./EditorModes.ts";

export class NormalMode implements IEditorModes {
  public IsFinding: boolean = false;
  private _editor: Editor;
  constructor(editor: Editor) {
    this._editor = editor;
  }

  public left() {
    this._editor.CursorPos = Math.max(0, this._editor.CursorPos - 1);
  }

  public right() {
    if (this._editor.CurrentLine?.value.Span[this._editor.CursorPos + 1] === "\n" && this._editor.State !== EditorStateEnum.VISUAL) {
      this._editor.CursorPos = Math.min(
        this._editor.CurrentLine!.value.Span.length - 2,
        this._editor.CursorPos + 1);
      return;
    }

    this._editor.CursorPos = Math.min(
      this._editor.CurrentLine!.value.Span.length - 1,
      this._editor.CursorPos + 1);
  }

  private _cursor_pos_ref = -1;
  private get _isVisual(): boolean {
    return this._editor.State === EditorStateEnum.VISUAL;
  }

  private effective_length(span: string): number {
    const len = span.length;
    if (!this._isVisual && len > 0 && span[len - 1] === '\n')
      return len - 1;
    return len;
  }

  public up() {
    if (this._editor.LinePos === 0)
      return;

    const prev_line = this._editor.CurrentLine?.prev;
    const prev_len = this.effective_length(prev_line?.value.Span ?? '');

    if (this._editor.CursorPos > this._cursor_pos_ref)
      this._cursor_pos_ref = this._editor.CursorPos;

    this._editor.LinePos--;
    this._editor.CursorPos = Math.min(this._cursor_pos_ref, Math.max(0, prev_len - 1));
  }

  public down() {
    if (this._editor.LinePos === this._editor.Text.count())
      return;

    const next_line = this._editor.CurrentLine?.next;
    const next_len = this.effective_length(next_line?.value.Span ?? '');

    if (this._editor.CursorPos > this._cursor_pos_ref)
      this._cursor_pos_ref = this._editor.CursorPos;

    this._editor.LinePos++;
    this._editor.CursorPos = Math.min(this._cursor_pos_ref, Math.max(0, next_len - 1));
  }

  public SetCursorPosRef(value: number) {
    this._cursor_pos_ref = value;
  }

  private _ln_pos_cache?: number[];
  /**
  * Moves the cursor to the start/end of the word/WORD forwards
  * @param start - Whether should go to start of word/WORD or end of word/WORD
  * @param word - Whether to search by word or WORD
  * */
  public go_word(start: boolean, word: boolean) {
    let curr_line = this._editor.Text.elementAtPos(this._editor.LinePos);

    let regex: RegExp;
    switch (true) {
      case (start && word): regex = Settings.WordRegexStart; break;
      case (!start && word): regex = Settings.WordRegexEnd; break;
      case (start && !word): regex = Settings.WORDRegexStart; break;
      default: regex = Settings.WORDRegexEnd;
    }

    let found = false;
    while (!found) {
      if (!curr_line) break;

      let indices: number[];
      if (this._ln_pos_cache?.[0] === this._editor.LinePos) {
        indices = this._ln_pos_cache!.slice(1);
      } else {
        indices = [...curr_line.value.Span.matchAll(regex)].map(x => x.index);
        this._ln_pos_cache = [this._editor.LinePos, ...indices];
      }

      const filtered = indices.filter(i => i > this._editor.CursorPos);

      if (filtered.length === 0) {
        if (!curr_line.next) break;
        curr_line = curr_line.next;
        this._editor.LinePos++;
        this._editor.CursorPos = 0;
        this._ln_pos_cache = undefined;
        continue;
      }

      this._editor.CursorPos = filtered[0];
      this._cursor_pos_ref = this._editor.CursorPos;
      found = true;
    }
  }

  /**
  * Moves the cursor to the start/end of the word/WORD backwards
  * @param start - Whether should go to start of word/WORD or end of word/WORD
  * @param word - Whether to search by word or WORD
  * */
  public go_back_word(start: boolean, word: boolean) {
    let curr_line = this._editor.Text.elementAtPos(this._editor.LinePos);

    let regex: RegExp;
    switch (true) {
      case (start && word): regex = Settings.WordRegexStart; break;
      case (!start && word): regex = Settings.WordRegexEnd; break;
      case (start && !word): regex = Settings.WORDRegexStart; break;
      default: regex = Settings.WORDRegexEnd;
    }

    let found = false;
    while (!found) {
      if (!curr_line) break;

      let indices: number[];
      if (this._ln_pos_cache?.[0] === this._editor.LinePos) {
        indices = this._ln_pos_cache!.slice(1);
      } else {
        indices = [...curr_line.value.Span.matchAll(regex)].map(x => x.index);
        this._ln_pos_cache = [this._editor.LinePos, ...indices];
      }

      const filtered = indices.filter(i => i < this._editor.CursorPos);

      if (filtered.length === 0) {
        if (!curr_line.prev) break;
        curr_line = curr_line.prev;
        this._editor.LinePos--;
        this._editor.CursorPos = curr_line.value.Span.length;
        this._ln_pos_cache = undefined;
        continue;
      }

      this._editor.CursorPos = filtered[filtered.length - 1];
      this._cursor_pos_ref = this._editor.CursorPos;
      found = true;
    }
  }

  // %
  public go_pair() {

  }

  // 0 
  public start_line() {
    this._editor.CursorPos = 0;
    this._cursor_pos_ref = this._editor.CursorPos;
  }

  // ^
  public nonwhitespace_start_line() {
    let current_line = this._editor.CurrentLine;
    let match = current_line?.value.Span.match(/\b\S/);
    if (match) {
      this._editor.CursorPos = match.index ?? this._editor.CursorPos;
      this._cursor_pos_ref = this._editor.CursorPos;
    }
  }

  // $
  public end_line() {
    let current_line = this._editor.Text.elementAtPos(this._editor.LinePos);
    if (!current_line) return;

    if (current_line.value.Span.endsWith("\n") && this._editor.State !== EditorStateEnum.VISUAL) {
      this._editor.CursorPos = current_line.value.Span.length - 2;
    } else {
      this._editor.CursorPos = current_line.value.Span.length - 1;
    }

    this._cursor_pos_ref = this._editor.CursorPos;
  }

  // gg
  public go_top() {
    this._editor.LinePos = 0;
    const is_visual = this._editor.State === EditorStateEnum.VISUAL;
    this._editor.CursorPos = Math.min(this._editor.Text.head?.value.Span.length! - 1 + (is_visual ? 0 : -1), this._editor.CursorPos);
    this._cursor_pos_ref = this._editor.CursorPos;
  }

  // G
  public go_bottom() {
    this._editor.LinePos = this._editor.Text.count();
    const is_visual = this._editor.State === EditorStateEnum.VISUAL;
    this._editor.CursorPos = Math.min(this._editor.Text.tail()!.value.Span.length! - 1 + (is_visual ? 0 : -1), this._editor.CursorPos);
    this._cursor_pos_ref = this._editor.CursorPos;
  }

  public FindChar: string | undefined;
  public FindForwards?: boolean;
  private _ln_find_pos_cache?: number[];
  // ;
  public next() {
    if (!this.IsFinding || !this.FindChar) return;

    let curr_line = this._editor.Text.elementAtPos(this._editor.LinePos);
    const regex = new RegExp(this.FindChar, 'g');

    let found = false;
    while (!found) {
      if (!curr_line) break;

      let indices: number[];
      if (this._ln_find_pos_cache?.[0] === this._editor.LinePos) {
        indices = this._ln_find_pos_cache!.slice(1);
      } else {
        indices = [...curr_line.value.Span.matchAll(regex)].map(x => x.index);
        this._ln_find_pos_cache = [this._editor.LinePos, ...indices];
      }

      const filtered = indices.filter(i => i > this._editor.CursorPos);

      if (filtered.length === 0) {
        if (!curr_line.next) break;
        curr_line = curr_line.next;
        this._editor.LinePos++;
        this._editor.CursorPos = 0;
        this._ln_find_pos_cache = undefined;
        continue;
      }

      this._editor.CursorPos = filtered[0];
      this._cursor_pos_ref = this._editor.CursorPos;
      found = true;
    }
  }

  // ,
  public prev() {
    if (!this.IsFinding || !this.FindChar) return;

    let curr_line = this._editor.CurrentLine;
    const regex = new RegExp(this.FindChar, 'g');

    let found = false;
    while (!found) {
      if (!curr_line) break;

      let indices: number[];
      if (this._ln_find_pos_cache?.[0] === this._editor.LinePos) {
        indices = this._ln_find_pos_cache!.slice(1);
      } else {
        indices = [...curr_line.value.Span.matchAll(regex)].map(x => x.index);
        this._ln_find_pos_cache = [this._editor.LinePos, ...indices];
      }

      const filtered = indices.filter(i => i < this._editor.CursorPos);

      if (filtered.length === 0) {
        if (!curr_line.prev) break;
        curr_line = curr_line.prev;
        this._editor.LinePos--;
        this._editor.CursorPos = curr_line.value.Span.length;
        this._ln_find_pos_cache = undefined;
        continue;
      }

      this._editor.CursorPos = filtered[filtered.length - 1];
      this._cursor_pos_ref = this._editor.CursorPos;
      found = true;
    }
  }

  // f
  public find() {
    if (this.IsFinding)
      return;

    this.IsFinding = true;
    this.FindForwards = true;
  }

  public find_backwards() {
    this.IsFinding = true;
    this.FindForwards = false;
  }

  public stop_find() {
    this.IsFinding = false;
    this.FindForwards = undefined;
  }

  // TODO: Fix these 2 functions
  // {
  public jump_up_paragraph() {
    let found = false;
    let iter = 0;
    let curr_line = this._editor.CurrentLine;
    while (!found) {
      let match = curr_line?.value.Span.match(/^\s*$/);
      if (match) {
        found = true;
        this._editor.CursorPos = 0;
        this._cursor_pos_ref = this._editor.CursorPos;
        this._editor.LinePos = this._editor.LinePos - iter;
        break;
      }

      let prev = curr_line?.prev;
      if (prev) {
        curr_line = prev;
        iter++;
      } else {
        this._editor.CursorPos = 0;
        this._cursor_pos_ref = this._editor.CursorPos;
        this._editor.LinePos = this._editor.LinePos - iter;
        break;
      }
    }
  }

  // } 
  public jump_down_paragraph() {
    let found = false;
    let iter = 0;
    let curr_line = this._editor.CurrentLine;
    while (!found) {
      let match = curr_line?.value.Span.match(/^\s*$/);
      if (match) {
        found = true;
        this._editor.CursorPos = 0;
        this._cursor_pos_ref = this._editor.CursorPos;
        this._editor.LinePos = this._editor.LinePos - iter;
        break;
      }

      let next = curr_line?.next;
      if (next) {
        curr_line = next;
        iter++;
      } else {
        this._editor.CursorPos = 0;
        this._cursor_pos_ref = this._editor.CursorPos;
        this._editor.LinePos = this._editor.LinePos + iter;
        break;
      }
    }
  }

  // Esc 
  public switch_normal() {
    if (this._editor.State === EditorStateEnum.INSERT) {
      this._editor.CurrentLine?.value.SaveBuffer();
    }

    this._editor.State = EditorStateEnum.NORMAL;
  }

  public undo() {
    console.log("undo not implemented")
  }

  public redo() {
    console.log("redo not implemented")
  }

  public paste() {
    const cursor_pos = this._editor.CursorPos;
    let currentNode = this._editor.Text.elementAtPos(this._editor.LinePos)!;
    const lines = this._editor.TextBuffer.match(/.*\n|.+$/g);
    if (!lines) return;

    if (lines.length === 1) {
      this.PasteWithin(lines, currentNode, cursor_pos);
      return;
    }

    currentNode.value.CreateBufferAt(cursor_pos, BufferTypeEnum.SPLITRIGHT);
    const tail = currentNode.value.ActiveZone ?? "";
    currentNode.value.UpdateActiveZone(lines[0]);
    currentNode.value.SaveBuffer();

    for (let i = 1; i < lines.length - 1; i++) {
      currentNode = currentNode.insert_next(
        new LinkedListNode<GapBuffer>(new GapBuffer(lines[i]))
      );
    }

    const lastLine = lines[lines.length - 1];
    if (lastLine.endsWith('\n')) {
      currentNode = currentNode.insert_next(
        new LinkedListNode<GapBuffer>(new GapBuffer(lastLine))
      );
    } else {
      currentNode.insert_next(
        new LinkedListNode<GapBuffer>(new GapBuffer(lastLine + tail))
      );
    }

    this._editor.CurrentLine = this._editor.Text.elementAtPos(this._editor.LinePos)!;
  }

  private PasteWithin(lines: RegExpMatchArray, currentNode: LinkedListNode<GapBuffer>, cursor_pos: number) {
    if (!lines[0].endsWith('\n')) {
      currentNode.value.CreateBufferRegion(cursor_pos, cursor_pos);
      currentNode.value.UpdateActiveZone(lines[0]);

      this._editor.CursorPos = cursor_pos + lines[0].length - 1;
      currentNode.value.SaveBuffer();
    }

    if (lines[0].endsWith('\n')) {
      currentNode.insert_next(new LinkedListNode<GapBuffer>(new GapBuffer(lines[0])));
      this._editor.LinePos++;
    }
  }

  public delete() {
    if (!this._editor.CurrentLine)
      return;

    let length = this._editor.CurrentLine.value.Span.length;
    let start = this._editor.CurrentLine.value.Span.slice(0, this._editor.CursorPos);
    let end = this._editor.CurrentLine.value.Span.slice(this._editor.CursorPos + 1, length);
    this._editor.CurrentLine.value.Span = start + end
  }
}
