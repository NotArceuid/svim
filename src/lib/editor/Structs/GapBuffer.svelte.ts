export class GapBuffer {
  public Span: string = $state("");
  public BufferPresent: boolean = $state(false);
  private _activeZone: string | null = $state(null);
  public get ActiveZone(): string | null {
    return this._activeZone;
  }

  private set ActiveZone(value) {
    this._activeZone = value;
  }

  public BufferLeft: string | null = $state(null);
  public BufferRight: string | null = $state(null);

  public BufferType?: BufferTypeEnum;

  constructor(span: string) {
    this.Span = span;
  }

  //  javascript doesnt support function overloading  bruv
  public CreateBufferAt(start: number, split_right = false) {
    if (split_right) {
      this.ActiveZone = this.Span.slice(0, start)
      this.BufferRight = this.Span.slice(start, this.Span.length) ?? "";
      this.BufferLeft = null;
      this.BufferPresent = true;
      this.BufferType = BufferTypeEnum.SPLITRIGHT;
      return;
    }

    this.ActiveZone = this.Span.slice(0, start)
    this.BufferLeft = this.Span.slice(start, this.Span.length) ?? "";
    this.BufferRight = null;
    this.BufferPresent = true;
    this.BufferType = BufferTypeEnum.SPLITLEFT;
  }

  public CreateBufferRegion(left_end: number, right_start: number) {
    this.BufferLeft = this.Span.slice(0, left_end);
    this.BufferRight = this.Span.slice(right_start, this.Span.length);
    this.ActiveZone = this.Span.slice(left_end, right_start);

    this.BufferPresent = true;
    this.BufferType = BufferTypeEnum.REGION;
  }

  public UpdateActiveZone(text: string) {
    this.ActiveZone = text;
  }

  public SaveBuffer() {
    switch (this.BufferType) {
      case BufferTypeEnum.REGION:
        this.Span = (this.BufferLeft ?? "") + this.ActiveZone + (this.BufferRight ?? "");
        break;
      case BufferTypeEnum.SPLITLEFT:
        console.log(this.ActiveZone)
        this.Span = (this.ActiveZone ?? "") + (this.BufferLeft ?? "");
        break;
      case BufferTypeEnum.SPLITRIGHT:
        this.Span = (this.BufferRight ?? "") + (this.ActiveZone ?? "");
        break;
    }

    this.BufferPresent = false;
    this.BufferType = undefined;

    this.BufferLeft = null;
    this.BufferRight = null;
    this.ActiveZone = null;
  }
}

/*
 * Region: Region buffer Left Buffer + ActiveZone + Right Buffer
 * Split Left: Active Zone + Right buffer
 * Split right: Left Buffer + Active Zone
 */
export enum BufferTypeEnum {
  REGION,
  SPLITLEFT,
  SPLITRIGHT
}
