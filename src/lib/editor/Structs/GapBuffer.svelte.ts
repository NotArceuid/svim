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

  private _bufferLeft: string | null = $state(null);
  private _bufferRight: string | null = $state(null);
  public get BufferLeft(): string | null {
    return this._bufferLeft;
  }
  private set BufferLeft(value) {
    this._bufferLeft = value;
  }

  public get BufferRight(): string | null {
    return this._bufferRight;
  }

  private set BufferRight(value) {
    this._bufferRight = value;
  }

  public BufferType?: BufferTypeEnum;

  constructor(span: string) {
    this.Span = span;
  }

  /**
   * Creates a gap buffer at the position
   * @param position start position of the buffer
   * @param split Split Left: Active Zone + Right buffer
   * Split right: Left Buffer + Active Zone
   */

  public CreateBufferAt(position: number, split: BufferTypeEnum.SPLITLEFT | BufferTypeEnum.SPLITRIGHT = BufferTypeEnum.SPLITLEFT) {
    switch (split) {
      case BufferTypeEnum.SPLITLEFT:
        this.ActiveZone = this.Span.slice(0, position)
        this.BufferRight = this.Span.slice(position, this.Span.length) ?? "";
        this.BufferLeft = null;
        this.BufferPresent = true;
        this.BufferType = BufferTypeEnum.SPLITLEFT;
        break;
      case BufferTypeEnum.SPLITRIGHT:
        this.BufferLeft = this.Span.slice(0, position)
        this.ActiveZone = this.Span.slice(position, this.Span.length) ?? "";
        this.BufferRight = null;
        this.BufferPresent = true;
        this.BufferType = BufferTypeEnum.SPLITRIGHT;
        break;
    }
  }

  /**
   * Create a region buffer
   * BufferLeft + ActiveZone + BufferRight
   * @param left_end start of the buffer
   * @param right_start end of the buffer
   */
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

  public UpdateBufferText(text: string) {
    switch (this.BufferType) {
      case BufferTypeEnum.SPLITLEFT:
        this.BufferRight = text;
        break;
      case BufferTypeEnum.SPLITRIGHT:
        this.BufferLeft = text;
        break;
      default:
        console.error("Invalid Buffer Type, Use Update Buffer Region Text")
        break;
    }
  }

  public UpdateBufferRegionText(left: string, right: string) {
    if (this.BufferType !== BufferTypeEnum.REGION) {
      console.error("Invalid Buffer Type, Use Update Buffer Text")
      return;
    }

    this.BufferLeft = left;
    this.BufferRight = right;
  }

  public SaveBuffer() {
    if (this.BufferType === undefined)
      return;

    switch (this.BufferType) {
      case BufferTypeEnum.REGION:
        this.Span = (this.BufferLeft ?? "") + this.ActiveZone + (this.BufferRight ?? "");
        break;
      case BufferTypeEnum.SPLITLEFT:
        this.Span = (this.ActiveZone ?? "") + (this.BufferRight ?? "");
        break;
      case BufferTypeEnum.SPLITRIGHT:
        this.Span = (this.BufferLeft ?? "") + (this.ActiveZone ?? "");
        break;
    }

    if (!this.Span.endsWith('\n'))
      this.Span += '\n';

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
