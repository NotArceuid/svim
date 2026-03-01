export class Observer<T, K> {
  private EventsMap: Array<(data: T) => K> = [];

  public Invoke(data: T) {
    this.EventsMap.forEach((k) => {
      k(data);
    })
  }

  public Add(fn: (data: T) => K) {
    this.EventsMap.push(fn);
  }
}
