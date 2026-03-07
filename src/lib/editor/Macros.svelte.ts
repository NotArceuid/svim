import { SvelteMap } from "svelte/reactivity";
import type { InputMapper } from "./Input.svelte.ts";

export class Macros {
  public MacroList: SvelteMap<string, string[]> = new SvelteMap();
  public ActiveMacro?: RecordingMacro = $state(undefined);

  private _inputMapper: InputMapper;
  constructor(inputMap: InputMapper) {
    this._inputMapper = inputMap;
  }

  public get IsMacroPrimed(): boolean {
    return this.prime_macro;
  }

  private prime_macro = $state(false);
  public PrimeMacro() {
    this.prime_macro = true;
  }

  public create_macro(name: string) {
    this.ActiveMacro = {
      Name: name,
      Value: [],
    }

    this.prime_macro = false;
  }

  public push(key: string) {
    if (!this.ActiveMacro)
      return;

    this.ActiveMacro.Value.push(key);
  }

  public stop_record() {
    if (!this.ActiveMacro)
      return;

    this.MacroList.set(this.ActiveMacro.Name, this.ActiveMacro.Value);
    this.ActiveMacro = undefined;
  }

  public clear_macro() {
    this.prime_macro = false;
    this.ActiveMacro = undefined;
  }

  public BeforePlay: boolean = false;
  public play_macro(key: string) {
    this.BeforePlay = false;
    const macro = this.MacroList.get(key);
    this._inputMapper.InputBuffer = "";
    if (!macro)
      return;

    macro.forEach((key) => {
      this._inputMapper.MapInput(key);
    })
  }
}

export interface RecordingMacro {
  Name: string,
  Value: string[],
}
