import { type Editor } from "../Editor.svelte.ts";
import { Settings } from "../Settings.ts";
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
  public up() {
    if (this._editor.LinePos == 0)
      return;

    let current_line = this._editor.CurrentLine;

    let prev_line = current_line?.prev;
    let prev_line_length = prev_line?.value.Span.length ?? 0;

    if (this._editor.CursorPos > this._cursor_pos_ref) {
      this._cursor_pos_ref = this._editor.CursorPos;
    }

    if (prev_line_length > this._cursor_pos_ref) {
      this._editor.LinePos = this._editor.LinePos - 1;

      if (this._cursor_pos_ref < this._editor.CursorPos)
        this._editor.CursorPos = this._cursor_pos_ref;

      return;
    }

    if (prev_line_length >= this._editor.CursorPos) {
      this._editor.LinePos = this._editor.LinePos - 1;
      return;
    }

    if (this._cursor_pos_ref >= prev_line_length) {
      this._editor.CursorPos = prev_line_length - 1;
      this._editor.LinePos = this._editor.LinePos - 1;
      return;
    }
  }

  // TODO: replace this with a much performant .length field
  public down() {
    if (this._editor.LinePos == this._editor.Text.count())
      return;

    let current_line = this._editor.CurrentLine;

    let next_line = current_line?.next;
    let next_line_length = next_line?.value.Span.length ?? 0;

    if (this._editor.CursorPos > this._cursor_pos_ref && next_line_length > this._editor.CursorPos) {
      this._cursor_pos_ref = this._editor.CursorPos;
    }

    if (next_line_length >= this._cursor_pos_ref) {
      this._editor.LinePos = this._editor.LinePos + 1;

      if (this._cursor_pos_ref < this._editor.CursorPos)
        this._editor.CursorPos = this._cursor_pos_ref;
      return;
    }

    if (next_line_length > this._editor.CursorPos) {
      this._editor.LinePos = this._editor.LinePos + 1;
      return;
    }

    if (this._cursor_pos_ref >= next_line_length) {
      this._editor.CursorPos = next_line_length - 1;
      this._editor.LinePos = this._editor.LinePos + 1;
      return;
    }

    this._editor.LinePos = this._editor.LinePos + 1;
  }

  /**
  * Moves the cursor to the start/end of the word/WORD backwards
  * @param start - Whether should go to start of word/WORD or end of word/WORD
  * @param word - Whether to search by word or WORD
  * */
  public go_word(start: boolean, word: boolean) {
    let curr_line = this._editor.Text.elementAtPos(this._editor.LinePos);

    let regex = undefined;
    switch (true) {
      case (start && word):
        regex = Settings.WordRegexStart;
        break;
      case (!start && word):
        regex = Settings.WordRegexEnd;
        break;
      case (start && !word):
        regex = Settings.WORDRegexStart;
        break;
      case (!start && !word):
        regex = Settings.WORDRegexEnd;
        break;
    }

    let found = false;
    while (!found) {
      if (!curr_line) break;

      let search_matches_iter = curr_line.value.Span.matchAll(regex!);
      let search_matches: Array<RegExpExecArray> = new Array<RegExpExecArray>();
      search_matches_iter.forEach((x) => {
        if (x.index <= this._editor.CursorPos)
          return;

        search_matches.push(x);
      })

      if (search_matches.length == 0) {
        if (!curr_line?.next)
          break;

        curr_line = curr_line.next;
        this._editor.LinePos++;
        this._editor.CursorPos = 0;
        continue;
      }

      this._editor.CursorPos = search_matches[0].index;
      this._cursor_pos_ref = this._editor.CursorPos;
      found = true;
    }
  }

  /**
  * Moves the cursor to the start/end of the word/WORD forwards
  * @param start - Whether should go to start of word/WORD or end of word/WORD
  * @param word - Whether to search by word or WORD
  * */
  public go_back_word(start: boolean, word: boolean) {
    let curr_line = this._editor.Text.elementAtPos(this._editor.LinePos);

    let regex = undefined;
    switch (true) {
      case (start && word):
        regex = Settings.WordRegexStart;
        break;
      case (!start && word):
        regex = Settings.WordRegexEnd;
        break;
      case (start && !word):
        regex = Settings.WORDRegexStart;
        break;
      case (!start && !word):
        regex = Settings.WORDRegexEnd;
        break;
    }

    let found = false;
    while (!found) {
      let search_matches_iter = curr_line?.value.Span.matchAll(regex!);
      let search_matches: Array<RegExpExecArray> = new Array<RegExpExecArray>();
      search_matches_iter?.forEach((x) => {
        if (x.index >= this._editor.CursorPos)
          return;

        search_matches.push(x);
      })

      if (search_matches.length == 0) {
        if (!curr_line?.prev) break;

        curr_line = curr_line.prev;

        this._editor.LinePos--;
        this._editor.CursorPos = curr_line.value.Span.length;
        continue;
      }

      this._editor.CursorPos = search_matches[search_matches.length - 1].index;
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

    let end_char = current_line.value.Span[current_line.value.Span.length - 1];
    if (end_char === "\n" && this._editor.State !== EditorStateEnum.VISUAL) {
      this._editor.CursorPos = current_line.value.Span.length - 2;
    } else {
      this._editor.CursorPos = current_line.value.Span.length - 1;
    }

    this._cursor_pos_ref = this._editor.CursorPos;
  }

  // gg
  public go_top() {
    this._editor.LinePos = 0;
    this._editor.CursorPos = Math.min(this._editor.Text.head?.value.Span.length! - 1, this._editor.CursorPos);
    this._cursor_pos_ref = this._editor.CursorPos;
  }

  // G
  public go_bottom() {
    this._editor.LinePos = this._editor.Text.count();
    this._editor.CursorPos = Math.min(this._editor.Text.tail()!.value.Span.length! - 1, this._editor.CursorPos);
    this._cursor_pos_ref = this._editor.CursorPos;
  }

  // ;
  public next() {

  }

  // ,
  public prev() {

  }

  // f
  public find() {
    this.IsFinding = true;
  }

  public stop_find() {
    this.IsFinding = false;
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

  }
}
