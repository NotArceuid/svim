export class LinkedListNode<T> {
  public value: T;
  public next: LinkedListNode<T> | null = $state(null);
  public prev: LinkedListNode<T> | null = $state(null);

  public insert_prev(node: LinkedListNode<T>) {
    node.prev = this.prev;
    node.next = this;

    if (this.prev !== null) {
      this.prev.next = node;
    }

    this.prev = node;
  }

  public insert_next(node: LinkedListNode<T>) {
    node.prev = this;
    node.next = this.next;

    if (this.next !== null) {
      this.next.prev = node;
    }

    this.next = node;
  }

  constructor(value: T) {
    this.value = value;
  }
}

export class LinkedList<T> implements Iterable<T> {
  [Symbol.iterator](): Iterator<T, any, any> {
    let cur = this.head;
    return {
      next: function(...[value]: [] | [any]): IteratorResult<T, any> {
        if (cur) {
          const value = cur.value;
          cur = cur.next;
          return { value: value, done: false }
        } else {
          return { value: undefined, done: true }
        }
      }
    }
  }

  public head: LinkedListNode<T> | null = $state(null);
  tail(): LinkedListNode<T> | null {
    if (this.head == null) {
      return null;
    }

    let current = this.head;
    while (current.next) {
      current = current.next;
    }

    return current;
  }

  count(): number {
    if (!this.head) return 0;
    let node = this.head;
    let count = 0;
    while (node.next) {
      count++;
      node = node.next;
    }

    return count;
  }

  prepend(val: T): void {
    const node = new LinkedListNode(val);
    node.next = this.head;
    node.prev = null;

    this.head = node;
  }

  append(val: T): void {
    let node = new LinkedListNode(val);
    if (!this.head) {
      this.head = node;
      return;
    }

    let curr_node = this.head;
    while (curr_node.next) {
      curr_node = curr_node.next;
    }

    curr_node.next = node;
    node.prev = curr_node;
  }

  deleteHead(): void {
    if (this.head) {
      this.head = this.head.next;
    }
  }

  deleteEnd(): void {
    let last = this.tail();
    if (!last)
      return;

    last.next = null;
  }

  elementAt(val: T): number | null {
    if (!this.head) return null;

    let idx = 0;
    while (this.head.value !== val) {
      idx++;
    }

    return idx;
  }

  elementAtPos(idx: number): LinkedListNode<T> | null {
    if (!this.head || idx < 0)
      return null;

    let curr = this.head;

    for (let i = 0; i < idx; i++) {
      if (!curr.next)
        return null;
      curr = curr.next;
    }

    return curr;
  }

  insertAt(pos: number, val: T): void {
    let node = new LinkedListNode(val);
    if (!this.head) {
      this.head = node;
      return;
    }

    if (pos === 0) {
      this.prepend(val);
      return;
    }

    let curr = this.head;
    for (let i = 0; i < pos; i++) {
      if (i !== pos - 1) {
        curr.next;
        continue;
      }

      if (i === pos - 1) {
        let next = curr.next;
        node.next = next;
        curr.next = node;
      }
    }

    if (!curr.next) return;
    curr.next = curr.next.next;
  }

  deleteAt(idx: number): void {
    if (!this.head) return;

    if (idx === 0) {
      this.head = this.head.next;
      return;
    }

    let curr = this.head;
    for (let i = 0; i < idx - 1; i++) {
      if (!curr.next) return;
      curr = curr.next;
    }

    if (!curr.next) return;
    curr.next = curr.next.next;
  }

  delete(val: T) {
    if (!this.head) return;
    if (this.head.value === val) {
      this.head = this.head.next;
      return;
    }

    let curr = this.head;
    while (curr.next) {
      if (curr.next.value === val) {
        curr.next = curr.next.next;
        return;
      }

      curr = curr.next;
    }
  }

  clear() {
    this.head = null;
  }
}
