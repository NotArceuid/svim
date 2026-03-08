export class LinkedListNode<T> {
  public value: T;
  public next: LinkedListNode<T> | null = $state(null);
  public prev: LinkedListNode<T> | null = $state(null);

  constructor(value: T) {
    this.value = $state(value);
  }

  public insert_prev(node: LinkedListNode<T>): LinkedListNode<T> {
    node.prev = this.prev;
    node.next = this;
    if (this.prev !== null) this.prev.next = node;
    this.prev = node;
    return node;
  }

  public insert_next(node: LinkedListNode<T>): LinkedListNode<T> {
    node.prev = this;
    node.next = this.next;
    if (this.next !== null) this.next.prev = node;
    this.next = node;
    return node;
  }

  // HORRIBLE FUNCTION, TRY NOT TO USE THIS
  public delete(): void {
    if (this.prev) this.prev.next = this.next;
    if (this.next) this.next.prev = this.prev;
    this.prev = null;
    this.next = null;
  }
}

export class LinkedList<T> implements Iterable<T> {
  public head: LinkedListNode<T> | null = $state(null);
  public length: number = $state(0);

  [Symbol.iterator](): Iterator<T> {
    let cur = this.head;
    return {
      next(): IteratorResult<T> {
        if (cur) {
          const value = cur.value;
          cur = cur.next;
          return { value, done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }

  tail(): LinkedListNode<T> | null {
    if (!this.head) return null;
    let curr = this.head;
    while (curr.next) curr = curr.next;
    return curr;
  }

  prepend(val: T): void {
    const node = new LinkedListNode(val);
    node.next = this.head;
    node.prev = null;
    if (this.head) this.head.prev = node;
    this.head = node;
    this.length++;
  }

  append(val: T): void {
    const node = new LinkedListNode(val);
    if (!this.head) {
      this.head = node;
      this.length++;
      return;
    }
    const last = this.tail()!;
    last.next = node;
    node.prev = last;
    this.length++;
  }

  elementAtPos(idx: number): LinkedListNode<T> | null {
    if (!this.head || idx < 0) return null;
    let curr = this.head;
    for (let i = 0; i < idx; i++) {
      if (!curr.next) return null;
      curr = curr.next;
    }
    return curr;
  }

  elementAt(val: T): number | null {
    let curr = this.head;
    let idx = 0;
    while (curr) {
      if (curr.value === val) return idx;
      curr = curr.next;
      idx++;
    }
    return null;
  }

  insertAt(pos: number, val: T): void {
    if (pos <= 0 || !this.head) {
      this.prepend(val);
      return;
    }
    if (pos >= this.length) {
      this.append(val);
      return;
    }
    const before = this.elementAtPos(pos - 1)!;
    const node = new LinkedListNode(val);
    before.insert_next(node);
    this.length++;
  }

  deleteHead(): void {
    if (!this.head) return;
    this.head = this.head.next;
    if (this.head) this.head.prev = null;
    this.length--;
  }

  deleteEnd(): void {
    if (!this.head) return;
    const last = this.tail()!;
    if (last.prev) {
      last.prev.next = null;
    } else {
      this.head = null;
    }
    this.length--;
  }

  deleteAt(idx: number): void {
    if (!this.head) return;
    if (idx === 0) { this.deleteHead(); return; }
    const target = this.elementAtPos(idx);
    if (!target) return;
    target.delete();
    this.length--;
  }

  delete(val: T): void {
    let curr = this.head;
    while (curr) {
      if (curr.value === val) {
        if (curr === this.head) {
          this.deleteHead();
        } else {
          curr.delete();
          this.length--;
        }
        return;
      }
      curr = curr.next;
    }
  }

  clear(): void {
    this.head = null;
    this.length = 0;
  }
}
