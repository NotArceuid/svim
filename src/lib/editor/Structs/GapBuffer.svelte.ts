export class GapBuffer {
  public Span: string;
  public BufferPresent: boolean = $state(false);
  public ActiveZone: string | null = $state(null);
  public BufferLeft: string | null = $state(null);
  public BufferRight: string | null = $state(null);

  public BufferType?: BufferTypeEnum;

  constructor(span: string) {
    this.Span = $state(span);
  }

  // gay ass javascript doesnt support function overloading  
  public CreateBufferAt(start: number) {
    this.ActiveZone = this.Span.slice(0, start)
    this.BufferRight = this.Span.slice(start, this.Span.length);

    this.BufferLeft = null;
    this.BufferPresent = true;
    this.BufferType = BufferTypeEnum.SPLIT;
  }

  public CreateBufferRegion(left_end: number, right_start: number) {
    this.BufferLeft = this.Span.slice(0, left_end);
    this.BufferRight = this.Span.slice(right_start, this.Span.length);

    this.BufferPresent = true;
    this.BufferType = BufferTypeEnum.REGION;
  }

  public SaveBuffer() {
    switch (this.BufferType) {
      case BufferTypeEnum.REGION:
        if (this.BufferLeft)
          this.Span = this.BufferLeft + this.ActiveZone + this.BufferRight;
        break;
      case BufferTypeEnum.SPLIT:
        if (this.ActiveZone)
          this.Span = this.ActiveZone + this.BufferRight;
        break;
    }

    this.BufferPresent = false;
    this.BufferType = undefined;

    this.BufferLeft = null;
    this.BufferRight = null;
    this.ActiveZone = null;
  }
}

export enum BufferTypeEnum {
  REGION,
  SPLIT
}
