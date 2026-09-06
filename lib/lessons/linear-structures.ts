import type { UsageGuide } from "./foundations.ts";
import type {
  LessonDefinition,
  VisualizationStep,
  VisualItem,
  VisualPointer,
} from "../visualization/types.ts";

export type LinearLessonId =
  | "singly-linked-list"
  | "doubly-linked-list"
  | "circular-linked-list"
  | "stack"
  | "queue"
  | "circular-queue"
  | "deque"
  | "hash-table";

export type LinearMeta = Readonly<{
  id: LinearLessonId;
  navLabel: string;
  shortLabel: string;
  title: string;
  description: string;
  concept: string;
  rule: string;
  analogy: string;
  usage: UsageGuide;
}>;

export type SinglyListInput = { values: string[]; afterIndex: number; value: string };
export type DoublyListInput = { values: string[]; removeIndex: number };
export type CircularListInput = { values: string[]; startIndex: number; visits: number };
export type CircularQueueInput = {
  slots: Array<string | null>;
  front: number;
  rear: number;
  value: string;
};
export type DequeInput = {
  values: string[];
  operation: "add-front" | "add-rear" | "remove-front" | "remove-rear";
  value?: string;
};
export type HashTableInput = {
  entries: Array<{ key: string; value: string }>;
  key: string;
  value: string;
  capacity: number;
};

function listItems(
  values: string[],
  active: number | null = null,
  special?: "entering" | "leaving",
  completed: number[] = [],
): VisualItem[] {
  return values.map((value, index) => ({
    id: `node-${index}`,
    value,
    label: index === 0 ? "HEAD" : index === values.length - 1 ? "TAIL" : `node ${index}`,
    state:
      index === active
        ? (special ?? "active")
        : completed.includes(index)
          ? "completed"
          : "idle",
  }));
}

function listPointers(values: string[]): VisualPointer[] {
  return [
    { id: "head", label: "HEAD", itemId: values.length ? "node-0" : null },
    { id: "tail", label: "TAIL", itemId: values.length ? `node-${values.length - 1}` : null },
  ];
}

export const singlyLinkedListLesson: LessonDefinition<SinglyListInput> = {
  id: "singly-linked-list-insert",
  title: "Singly linked list insertion",
  category: "data-structure",
  code: [
    "new_node = Node(value)",
    "current = head",
    "for _ in range(after_index):",
    "    current = current.next",
    "new_node.next = current.next",
    "current.next = new_node",
  ],
  validate: ({ values, afterIndex, value }) => {
    if (values.length < 1 || values.length > 8) return { valid: false, message: "Use 1 to 8 list nodes." };
    if (afterIndex < 0 || afterIndex >= values.length) return { valid: false, message: "Choose an existing node." };
    if (!value.trim()) return { valid: false, message: "Insertion needs a value." };
    return { valid: true };
  },
  createSteps: ({ values, afterIndex, value }) => {
    const steps: VisualizationStep[] = [{
      id: "singly-0",
      operation: "inspect-head",
      explanation: "HEAD points to the first node. Each node stores a value and one link to the next node.",
      codeLine: 1,
      frame: { layout: "linked-list", items: listItems(values, 0), pointers: listPointers(values), caption: "Follow next → from HEAD to TAIL" },
    }];
    for (let index = 0; index <= afterIndex; index += 1) {
      steps.push({
        id: `singly-walk-${index}`,
        operation: "follow-next",
        explanation: index === afterIndex ? `Stop at ${values[index]}. The new node will be inserted after it.` : `Follow next from ${values[index]} to ${values[index + 1]}.`,
        codeLine: index === afterIndex ? 3 : 2,
        frame: { layout: "linked-list", items: listItems(values, index, undefined, Array.from({ length: index }, (_, i) => i)), pointers: listPointers(values), caption: `Current node: ${values[index]}` },
      });
    }
    const inserted = [...values.slice(0, afterIndex + 1), value, ...values.slice(afterIndex + 1)];
    steps.push({
      id: "singly-link-new",
      operation: "link-new-node",
      explanation: `${value}.next first points to the node that originally followed ${values[afterIndex]}.`,
      codeLine: 4,
      frame: { layout: "linked-list", items: listItems(inserted, afterIndex + 1, "entering"), pointers: listPointers(inserted), caption: "Connect the new node before changing the old link" },
    }, {
      id: "singly-complete",
      operation: "insert-complete",
      explanation: `${values[afterIndex]}.next now points to ${value}. The node is part of the list.`,
      codeLine: 5,
      frame: { layout: "linked-list", items: listItems(inserted, afterIndex + 1, undefined, [afterIndex + 1]), pointers: listPointers(inserted), caption: `${inserted.length} linked nodes` },
    });
    return steps;
  },
};

export const doublyLinkedListLesson: LessonDefinition<DoublyListInput> = {
  id: "doubly-linked-list-remove",
  title: "Doubly linked list removal",
  category: "data-structure",
  code: [
    "current = nodes[remove_index]",
    "previous_node = current.prev",
    "next_node = current.next",
    "previous_node.next = next_node",
    "next_node.prev = previous_node",
    "del current",
  ],
  validate: ({ values, removeIndex }) => {
    if (values.length < 3 || values.length > 8) return { valid: false, message: "Use 3 to 8 nodes." };
    if (removeIndex <= 0 || removeIndex >= values.length - 1) return { valid: false, message: "This lesson removes a middle node." };
    return { valid: true };
  },
  createSteps: ({ values, removeIndex }) => {
    const removed = values[removeIndex];
    const remaining = values.filter((_, index) => index !== removeIndex);
    return [
      {
        id: "doubly-0",
        operation: "inspect-links",
        explanation: "Each node has next → and ← prev links, so movement works in both directions.",
        codeLine: 0,
        frame: { layout: "doubly-linked-list", items: listItems(values, removeIndex), pointers: listPointers(values), caption: "← prev · next →" },
      },
      {
        id: "doubly-1",
        operation: "save-neighbors",
        explanation: `Before removing ${removed}, remember its neighbors: ${values[removeIndex - 1]} and ${values[removeIndex + 1]}.`,
        codeLine: 2,
        frame: { layout: "doubly-linked-list", items: listItems(values, removeIndex, "leaving"), pointers: listPointers(values), caption: "Keep both neighbors before unlinking" },
      },
      {
        id: "doubly-2",
        operation: "bridge-next",
        explanation: `${values[removeIndex - 1]}.next skips ${removed} and points to ${values[removeIndex + 1]}.`,
        codeLine: 3,
        frame: { layout: "doubly-linked-list", items: listItems(values, removeIndex, "leaving", [removeIndex - 1]), pointers: listPointers(values), caption: "Update the forward link" },
      },
      {
        id: "doubly-3",
        operation: "bridge-prev",
        explanation: `${values[removeIndex + 1]}.prev now points back to ${values[removeIndex - 1]}.`,
        codeLine: 4,
        frame: { layout: "doubly-linked-list", items: listItems(values, removeIndex, "leaving", [removeIndex - 1, removeIndex + 1]), pointers: listPointers(values), caption: "Update the backward link" },
      },
      {
        id: "doubly-complete",
        operation: "remove-complete",
        explanation: `${removed} is disconnected. The remaining nodes are linked in both directions.`,
        codeLine: 5,
        frame: { layout: "doubly-linked-list", items: listItems(remaining, null, undefined, remaining.map((_, i) => i)), pointers: listPointers(remaining), caption: `${remaining.length} nodes remain` },
      },
    ];
  },
};

export const circularLinkedListLesson: LessonDefinition<CircularListInput> = {
  id: "circular-linked-list-traverse",
  title: "Circular linked list traversal",
  category: "data-structure",
  code: [
    "current = start",
    "while True:",
    "    visit(current.value)",
    "    current = current.next",
    "    if current is start:",
    "        break",
  ],
  validate: ({ values, startIndex, visits }) => {
    if (values.length < 2 || values.length > 8) return { valid: false, message: "Use 2 to 8 nodes." };
    if (startIndex < 0 || startIndex >= values.length) return { valid: false, message: "Choose an existing start node." };
    if (visits < 1 || visits > values.length + 1) return { valid: false, message: "Visit count is outside this lesson." };
    return { valid: true };
  },
  createSteps: ({ values, startIndex, visits }) => {
    const steps: VisualizationStep[] = [];
    const visited: number[] = [];
    for (let count = 0; count < visits; count += 1) {
      const index = (startIndex + count) % values.length;
      steps.push({
        id: `circular-${count}`,
        operation: count === values.length ? "cycle-detected" : "visit-node",
        explanation: count === values.length
          ? `The next link returns to the start node ${values[startIndex]}. Stop to avoid looping forever.`
          : `Visit ${values[index]}, then follow its next link${index === values.length - 1 ? " back to HEAD" : ""}.`,
        codeLine: count === values.length ? 5 : 3,
        frame: {
          layout: "circular-linked-list",
          items: listItems(values, index, undefined, visited),
          pointers: [{ id: "start", label: "START", itemId: `node-${startIndex}` }],
          caption: count === values.length ? "Cycle completed" : "TAIL.next points back to HEAD",
        },
      });
      if (!visited.includes(index)) visited.push(index);
    }
    return steps;
  },
};

function circularQueueItems(input: CircularQueueInput, active: number | null, special?: "entering"): VisualItem[] {
  return input.slots.map((value, index) => ({
    id: `slot-${index}`,
    value: value ?? "empty",
    label: `slot ${index}${index === input.front ? " · FRONT" : ""}${index === input.rear ? " · REAR" : ""}`,
    state: index === active ? (special ?? "active") : value === null ? "muted" : "idle",
  }));
}

export const circularQueueLesson: LessonDefinition<CircularQueueInput> = {
  id: "circular-queue-enqueue",
  title: "Circular queue enqueue",
  category: "data-structure",
  code: [
    "next_rear = (rear + 1) % capacity",
    "if next_rear == front:",
    "    raise QueueFull",
    "slots[next_rear] = value",
    "rear = next_rear",
  ],
  validate: ({ slots, front, rear, value }) => {
    if (slots.length < 4 || slots.length > 8) return { valid: false, message: "Use 4 to 8 circular slots." };
    if (front < 0 || rear < 0 || front >= slots.length || rear >= slots.length) return { valid: false, message: "Front and rear must point inside the queue." };
    if (!value.trim()) return { valid: false, message: "Enqueue needs a value." };
    const nextRear = (rear + 1) % slots.length;
    if (slots[nextRear] !== null) return { valid: false, message: "The next circular slot must be empty for this lesson." };
    return { valid: true };
  },
  createSteps: (input) => {
    const nextRear = (input.rear + 1) % input.slots.length;
    const entered = { ...input, slots: [...input.slots] };
    entered.slots[nextRear] = input.value;
    const completed = { ...entered, rear: nextRear };
    return [
      {
        id: "cqueue-0",
        operation: "find-next-slot",
        explanation: `REAR is at slot ${input.rear}. Move one step using modulo: (${input.rear} + 1) % ${input.slots.length} = ${nextRear}.`,
        codeLine: 0,
        frame: { layout: "circular-queue", items: circularQueueItems(input, nextRear), caption: "Modulo wraps the index back to 0 after the last slot" },
      },
      {
        id: "cqueue-1",
        operation: "write-value",
        explanation: `Slot ${nextRear} is empty, so place ${input.value} there.`,
        codeLine: 3,
        frame: { layout: "circular-queue", items: circularQueueItems(entered, nextRear, "entering"), caption: `Writing ${input.value} into slot ${nextRear}` },
      },
      {
        id: "cqueue-2",
        operation: "move-rear",
        explanation: `REAR moves to slot ${nextRear}. The fixed array has been reused without shifting values.`,
        codeLine: 4,
        frame: { layout: "circular-queue", items: circularQueueItems(completed, nextRear), caption: "Enqueue complete" },
      },
    ];
  },
};

export const dequeLesson: LessonDefinition<DequeInput> = {
  id: "deque-operation",
  title: "Deque operation",
  category: "data-structure",
  code: [
    "from collections import deque",
    "items = deque([20, 30, 40])",
    "items.appendleft(value)  # add front",
    "items.append(value)      # add rear",
    "items.popleft()          # remove front",
    "items.pop()              # remove rear",
  ],
  validate: ({ values, operation, value }) => {
    if (values.length < 1 || values.length > 8) return { valid: false, message: "Use 1 to 8 deque values." };
    if (operation.startsWith("add") && !value?.trim()) return { valid: false, message: "Adding needs a value." };
    return { valid: true };
  },
  createSteps: ({ values, operation, value }) => {
    const addFront = operation === "add-front";
    const addRear = operation === "add-rear";
    const removeFront = operation === "remove-front";
    const activeIndex = addFront || removeFront ? 0 : values.length - 1;
    const nextValues = [...values];
    let explanation = "";
    let codeLine = 2;
    let removed = "";
    if (addFront) { nextValues.unshift(value ?? "new"); explanation = `${value} enters at the FRONT.`; codeLine = 2; }
    if (addRear) { nextValues.push(value ?? "new"); explanation = `${value} enters at the REAR.`; codeLine = 3; }
    if (removeFront) { removed = nextValues.shift() ?? ""; explanation = `${removed} leaves from the FRONT.`; codeLine = 4; }
    if (operation === "remove-rear") { removed = nextValues.pop() ?? ""; explanation = `${removed} leaves from the REAR.`; codeLine = 5; }
    const nextActive = addFront ? 0 : addRear ? nextValues.length - 1 : null;
    return [
      {
        id: "deque-0",
        operation: "choose-end",
        explanation: `A deque exposes both ends. This operation uses the ${addFront || removeFront ? "FRONT" : "REAR"}.`,
        codeLine,
        frame: { layout: "deque", items: listItems(values, activeIndex), caption: "FRONT ⇄ values ⇄ REAR" },
      },
      {
        id: "deque-1",
        operation,
        explanation,
        codeLine,
        frame: { layout: "deque", items: listItems(nextValues, nextActive, addFront || addRear ? "entering" : undefined), caption: addFront || addRear ? `${value} added` : `${removed} removed` },
      },
      {
        id: "deque-2",
        operation: "operation-complete",
        explanation: `The deque still allows constant-time operations at both the FRONT and REAR.`,
        codeLine,
        frame: { layout: "deque", items: listItems(nextValues, null, undefined, nextValues.map((_, i) => i)), caption: `${nextValues.length} values remain` },
      },
    ];
  },
};

function hashKey(key: string, capacity: number): number {
  return [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0) % capacity;
}

function hashItems(entries: HashTableInput["entries"], capacity: number, active: number | null, special?: "entering"): VisualItem[] {
  const buckets = Array.from({ length: capacity }, () => [] as string[]);
  for (const entry of entries) buckets[hashKey(entry.key, capacity)].push(`${entry.key}: ${entry.value}`);
  return buckets.map((bucket, index) => ({
    id: `bucket-${index}`,
    value: bucket.length ? bucket.join(" → ") : "empty",
    label: `bucket ${index}`,
    state: index === active ? (special ?? "active") : bucket.length ? "idle" : "muted",
  }));
}

export const hashTableLesson: LessonDefinition<HashTableInput> = {
  id: "hash-table-insert",
  title: "Hash table insertion",
  category: "data-structure",
  code: [
    "def bucket_for(key, capacity):",
    "    total = sum(ord(char) for char in key)",
    "    return total % capacity",
    "",
    "bucket = bucket_for(key, len(table))",
    "table[bucket].append((key, value))",
  ],
  validate: ({ key, capacity }) => {
    if (!key.trim()) return { valid: false, message: "A hash key cannot be empty." };
    if (capacity < 3 || capacity > 10) return { valid: false, message: "Use 3 to 10 buckets." };
    return { valid: true };
  },
  createSteps: ({ entries, key, value, capacity }) => {
    const bucket = hashKey(key, capacity);
    const existing = entries.filter((entry) => hashKey(entry.key, capacity) === bucket);
    const inserted = [...entries, { key, value }];
    return [
      {
        id: "hash-0",
        operation: "hash-key",
        explanation: `Convert every character in “${key}” to a number, add them, then take modulo ${capacity}.`,
        codeLine: 1,
        frame: { layout: "hash-table", items: hashItems(entries, capacity, null), caption: `hash(“${key}”) % ${capacity}` },
      },
      {
        id: "hash-1",
        operation: "choose-bucket",
        explanation: `The hash result is ${bucket}, so go directly to bucket ${bucket}.`,
        codeLine: 4,
        frame: { layout: "hash-table", items: hashItems(entries, capacity, bucket), caption: `Target bucket: ${bucket}` },
      },
      {
        id: "hash-2",
        operation: existing.length ? "handle-collision" : "insert-entry",
        explanation: existing.length
          ? `Bucket ${bucket} already contains ${existing.map((entry) => entry.key).join(", ")}. Keep both entries in a short chain.`
          : `Bucket ${bucket} is empty, so insert the entry directly.`,
        codeLine: 5,
        frame: { layout: "hash-table", items: hashItems(inserted, capacity, bucket, "entering"), caption: existing.length ? "Collision resolved by chaining" : "Entry inserted" },
      },
      {
        id: "hash-3",
        operation: "insert-complete",
        explanation: `“${key}” can now be found by hashing it to bucket ${bucket} again.`,
        codeLine: 5,
        frame: { layout: "hash-table", items: hashItems(inserted, capacity, bucket), caption: `${inserted.length} stored entries` },
      },
    ];
  },
};

export const linearMeta: Record<LinearLessonId, LinearMeta> = {
  "singly-linked-list": {
    id: "singly-linked-list", navLabel: "Singly linked list", shortLabel: "SL", title: "Singly linked list", description: "Follow one-way next pointers and insert a node without shifting the rest of the list.", concept: "Like a treasure hunt, every clue tells you only where the next clue is.", rule: "Each node knows the next node", analogy: "Treasure-hunt clues",
    usage: { summary: "Use a singly linked list when the sequence changes often and forward traversal is enough.", examples: ["Music playlists", "Free-memory lists", "Hash bucket chains"], chooseWhen: "Insertions and removals matter more than jumping to an index.", avoidWhen: "You need fast random access or frequent backward movement.", operations: [{ name: "Add at head", cost: "O(1)" }, { name: "Search", cost: "O(n)" }, { name: "Read by index", cost: "O(n)" }], practice: "Insert a node after the first matching value." },
  },
  "doubly-linked-list": {
    id: "doubly-linked-list", navLabel: "Doubly linked list", shortLabel: "DL", title: "Doubly linked list", description: "See how prev and next pointers support movement and updates in both directions.", concept: "Like train cars coupled at both ends, each node knows the car before and after it.", rule: "Update both directions", analogy: "Connected train cars",
    usage: { summary: "Use a doubly linked list when you need efficient movement and removal in both directions.", examples: ["Browser history", "Undo/redo navigation", "LRU cache ordering"], chooseWhen: "You already have a node reference and need fast removal or backward traversal.", avoidWhen: "Memory is tight or forward-only links are sufficient.", operations: [{ name: "Remove known node", cost: "O(1)" }, { name: "Move next/prev", cost: "O(1)" }, { name: "Search", cost: "O(n)" }], practice: "Remove a selected middle node while preserving both directions." },
  },
  "circular-linked-list": {
    id: "circular-linked-list", navLabel: "Circular linked list", shortLabel: "CL", title: "Circular linked list", description: "Traverse a linked list whose tail points back to the beginning instead of None.", concept: "Like runners on a track, following next eventually returns you to the starting point.", rule: "The tail links back to the start", analogy: "Runners on a track",
    usage: { summary: "Use a circular list for repeating turns or tasks with no natural final item.", examples: ["Round-robin scheduling", "Turn-based games", "Repeating playlists"], chooseWhen: "Processing should repeatedly cycle through participants.", avoidWhen: "A clear end marker is important or accidental infinite loops are risky.", operations: [{ name: "Move next", cost: "O(1)" }, { name: "Full traversal", cost: "O(n)" }, { name: "Insert after known node", cost: "O(1)" }], practice: "Visit every node exactly once without relying on None." },
  },
  stack: {
    id: "stack", navLabel: "Stack", shortLabel: "ST", title: "Stack", description: "Push and pop values at one open end called TOP.", concept: "Like cafeteria trays, you add and remove only from the top.", rule: "Last in, first out", analogy: "Stacked trays",
    usage: { summary: "Use a stack when the newest unfinished work should be handled first.", examples: ["Undo history", "Function calls", "Bracket matching"], chooseWhen: "Actions must be reversed or nested work finishes before earlier work.", avoidWhen: "Items should leave in arrival order.", operations: [{ name: "Push", cost: "O(1)" }, { name: "Pop", cost: "O(1)" }, { name: "Search", cost: "O(n)" }], practice: "Use a stack to check balanced brackets." },
  },
  queue: {
    id: "queue", navLabel: "Queue", shortLabel: "QU", title: "Queue", description: "Enqueue at REAR and dequeue from FRONT so arrivals remain fair.", concept: "Like a service line, the first person to arrive is served first.", rule: "First in, first out", analogy: "Service line",
    usage: { summary: "Use a queue when work should be handled in arrival order.", examples: ["Print jobs", "Request processing", "Breadth-first search"], chooseWhen: "Older work should be processed before newer work.", avoidWhen: "Newest or highest-priority work should go first.", operations: [{ name: "Enqueue", cost: "O(1)" }, { name: "Dequeue", cost: "O(1)" }, { name: "Search", cost: "O(n)" }], practice: "Process tasks in the same order they arrive." },
  },
  "circular-queue": {
    id: "circular-queue", navLabel: "Circular queue", shortLabel: "CQ", title: "Circular queue", description: "Reuse fixed array slots by wrapping FRONT and REAR around the end.", concept: "Like seats on a carousel, the position after the last seat is the first seat again.", rule: "Modulo creates the wrap-around", analogy: "Carousel seats",
    usage: { summary: "Use a circular queue for a bounded stream that repeatedly reuses storage.", examples: ["Audio buffers", "Device input buffers", "Fixed-size task queues"], chooseWhen: "Capacity is fixed and shifting array values would be wasteful.", avoidWhen: "The queue must grow without a known limit.", operations: [{ name: "Enqueue", cost: "O(1)" }, { name: "Dequeue", cost: "O(1)" }, { name: "Stored slots", cost: "O(capacity)" }], practice: "Advance REAR through the final slot and back to slot 0." },
  },
  deque: {
    id: "deque", navLabel: "Deque", shortLabel: "DQ", title: "Double-ended queue", description: "Add or remove values at both FRONT and REAR.", concept: "Like a train platform with doors at both ends, values can enter or leave either side.", rule: "Both ends stay open", analogy: "Two-ended platform",
    usage: { summary: "Use a deque when both oldest-first and newest-first operations are needed.", examples: ["Sliding-window maximum", "Work-stealing queues", "Palindrome checks"], chooseWhen: "You need constant-time changes at either end.", avoidWhen: "You need indexed access in the middle.", operations: [{ name: "Add either end", cost: "O(1)" }, { name: "Remove either end", cost: "O(1)" }, { name: "Search", cost: "O(n)" }], practice: "Check whether a word is a palindrome from both ends." },
  },
  "hash-table": {
    id: "hash-table", navLabel: "Hash table", shortLabel: "HT", title: "Hash table", description: "Turn a key into a bucket index and handle collisions when keys share a bucket.", concept: "Like labeled mail sorted into numbered cubbies, a rule tells you which cubby to open.", rule: "Hash key → choose bucket", analogy: "Mailroom cubbies",
    usage: { summary: "Use a hash table for fast lookup by descriptive keys.", examples: ["User records by ID", "Word frequency counts", "Caches and dictionaries"], chooseWhen: "Fast average lookup, insertion, and deletion by key matter.", avoidWhen: "Sorted order or predictable worst-case lookup is required.", operations: [{ name: "Lookup average", cost: "O(1)" }, { name: "Insert average", cost: "O(1)" }, { name: "Worst collision", cost: "O(n)" }], practice: "Count word frequencies with a dictionary." },
  },
};
