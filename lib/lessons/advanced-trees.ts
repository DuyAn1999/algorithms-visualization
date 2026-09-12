import type { UsageGuide } from "./foundations.ts";
import type { LessonDefinition, VisualizationStep, VisualItem } from "../visualization/types.ts";

export type AdvancedTreeLessonId =
  | "bst-rule" | "bst-search" | "bst-insert" | "bst-delete"
  | "heap-insert" | "heap-extract" | "avl-balance";
export type RotationKind = "ll" | "rr" | "lr" | "rl";
export type AdvancedTreeInput = { values: number[]; value: number; rotation: RotationKind };

export type AdvancedTreeMeta = Readonly<{
  id: AdvancedTreeLessonId;
  navLabel: string;
  shortLabel: string;
  title: string;
  description: string;
  concept: string;
  rule: string;
  analogy: string;
  usage: UsageGuide;
}>;

type Node = { id: string; value: number; left: Node | null; right: Node | null; parent: Node | null };

function basicValidation(values: number[]) {
  if (values.length < 3 || values.length > 9) return { valid: false as const, message: "Use 3 to 9 values." };
  if (!values.every(Number.isInteger)) return { valid: false as const, message: "Use whole numbers only." };
  if (new Set(values).size !== values.length) return { valid: false as const, message: "Use distinct values so every node is easy to identify." };
  return { valid: true as const };
}

function buildBst(values: number[]): Node | null {
  if (!values.length) return null;
  const root: Node = { id: "bst-0", value: values[0], left: null, right: null, parent: null };
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index];
    const node: Node = { id: `bst-${index}`, value, left: null, right: null, parent: null };
    let current = root;
    while (true) {
      if (value < current.value) {
        if (!current.left) { current.left = node; node.parent = current; break; }
        current = current.left;
      } else {
        if (!current.right) { current.right = node; node.parent = current; break; }
        current = current.right;
      }
    }
  }
  return root;
}

function nodesBreadthFirst(root: Node | null) {
  if (!root) return [];
  const nodes: Node[] = []; const queue = [root];
  while (queue.length) { const node = queue.shift()!; nodes.push(node); if (node.left) queue.push(node.left); if (node.right) queue.push(node.right); }
  return nodes;
}

function treeItems(root: Node | null, active: string[] = [], completed: string[] = [], special: Record<string, "entering" | "leaving"> = {}, muted: string[] = []): VisualItem[] {
  return nodesBreadthFirst(root).map((node) => ({
    id: node.id, value: node.value,
    label: node.parent === null ? "ROOT" : !node.left && !node.right ? "LEAF" : "NODE",
    parentId: node.parent?.id ?? null,
    edgeLabel: node.parent?.left === node ? "left" : node.parent ? "right" : undefined,
    state: special[node.id] ?? (active.includes(node.id) ? "active" : completed.includes(node.id) ? "completed" : muted.includes(node.id) ? "muted" : "idle"),
  }));
}

function treeFrame(root: Node | null, active: string[], completed: string[], caption: string, output: Array<string | number> = [], special: Record<string, "entering" | "leaving"> = {}, muted: string[] = []) {
  return { layout: "tree" as const, items: treeItems(root, active, completed, special, muted), caption, output };
}

function findPath(root: Node, value: number) {
  const path: Node[] = []; let current: Node | null = root;
  while (current) { path.push(current); if (value === current.value) break; current = value < current.value ? current.left : current.right; }
  return path;
}

function inorder(root: Node | null, nodes: Node[] = []) {
  if (!root) return nodes;
  inorder(root.left, nodes); nodes.push(root); inorder(root.right, nodes); return nodes;
}

export const bstRuleLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "bst-rule", title: "Binary search tree rule", category: "data-structure",
  code: ["class BSTNode:", "    def __init__(self, value):", "        self.value = value", "        self.left = None", "        self.right = None", "", "# left values < node < right values"],
  validate: ({ values }) => basicValidation(values),
  createSteps: ({ values }) => {
    const root = buildBst(values)!; const all = nodesBreadthFirst(root); const left = all.filter((node) => node.value < root.value); const right = all.filter((node) => node.value > root.value); const sorted = inorder(root).map((node) => node.value);
    return [
      { id: "bst-rule-0", operation: "choose-root", explanation: `${values[0]} becomes the root because it is inserted first.`, codeLine: 2, frame: treeFrame(root, [root.id], [], "Insertion order shapes the tree") },
      { id: "bst-rule-1", operation: "check-left", explanation: `Every value in the root's left subtree is smaller than ${root.value}.`, codeLine: 6, frame: treeFrame(root, left.map((node) => node.id), [root.id], "Smaller values branch left") },
      { id: "bst-rule-2", operation: "check-right", explanation: `Every value in the root's right subtree is larger than ${root.value}. The same rule repeats at every node.`, codeLine: 6, frame: treeFrame(root, right.map((node) => node.id), [root.id], "Larger values branch right") },
      { id: "bst-rule-3", operation: "verify-inorder", explanation: `An inorder traversal returns ${sorted.join(", ")}, proving the search-tree ordering.`, codeLine: 6, frame: treeFrame(root, [], all.map((node) => node.id), "Inorder is sorted", sorted) },
    ];
  },
};

export const bstSearchLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "bst-search", title: "BST search", category: "algorithm",
  code: ["def search(node, target):", "    while node is not None:", "        if target == node.value:", "            return node", "        if target < node.value:", "            node = node.left", "        else:", "            node = node.right", "    return None"],
  validate: ({ values, value }) => Number.isInteger(value) ? basicValidation(values) : { valid: false, message: "The target must be a whole number." },
  createSteps: ({ values, value }) => {
    const root = buildBst(values)!; const path = findPath(root, value); const steps: VisualizationStep[] = []; const checked: string[] = [];
    path.forEach((node, index) => {
      steps.push({ id: `bst-search-${index}`, operation: "compare", explanation: value === node.value ? `${value} matches this node.` : `${value} is ${value < node.value ? "smaller" : "larger"} than ${node.value}, so follow the ${value < node.value ? "LEFT" : "RIGHT"} edge.`, codeLine: value === node.value ? 2 : value < node.value ? 4 : 6, frame: treeFrame(root, [node.id], [], `Search path: ${[...checked.map((id) => nodesBreadthFirst(root).find((item) => item.id === id)!.value), node.value].join(" → ")}`, path.slice(0, index + 1).map((item) => item.value), {}, checked) });
      checked.push(node.id);
    });
    const found = path.at(-1)?.value === value;
    steps.push({ id: "bst-search-complete", operation: found ? "found" : "not-found", explanation: found ? `Found ${value} after ${path.length} comparison${path.length === 1 ? "" : "s"}.` : `The required child is None, so ${value} is not in this tree.`, codeLine: found ? 3 : 8, frame: treeFrame(root, found ? [] : [], found ? [path.at(-1)!.id] : [], found ? `Found ${value}` : `${value} is absent`, path.map((node) => node.value), {}, found ? checked.slice(0, -1) : checked) });
    return steps;
  },
};

export const bstInsertLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "bst-insert", title: "BST insertion", category: "algorithm",
  code: ["def insert(root, value):", "    if root is None:", "        return Node(value)", "    if value < root.value:", "        root.left = insert(root.left, value)", "    else:", "        root.right = insert(root.right, value)", "    return root"],
  validate: ({ values, value }) => { const base = basicValidation(values); if (!base.valid) return base; if (!Number.isInteger(value)) return { valid: false, message: "The new value must be a whole number." }; if (values.includes(value)) return { valid: false, message: "Choose a value not already in this tree." }; return { valid: true }; },
  createSteps: ({ values, value }) => {
    const root = buildBst(values)!; const path = findPath(root, value); const steps: VisualizationStep[] = []; const checked: string[] = [];
    path.forEach((node, index) => { steps.push({ id: `bst-insert-${index}`, operation: "choose-branch", explanation: `${value} is ${value < node.value ? "smaller" : "larger"} than ${node.value}; continue ${value < node.value ? "LEFT" : "RIGHT"}.`, codeLine: value < node.value ? 3 : 5, frame: treeFrame(root, [node.id], [], `Insertion path: ${path.slice(0, index + 1).map((item) => item.value).join(" → ")}`, path.slice(0, index + 1).map((item) => item.value), {}, checked) }); checked.push(node.id); });
    const parent = path.at(-1)!; const inserted: Node = { id: `bst-${values.length}`, value, left: null, right: null, parent };
    if (value < parent.value) parent.left = inserted; else parent.right = inserted;
    steps.push({ id: "bst-insert-attach", operation: "attach-leaf", explanation: `The ${value < parent.value ? "left" : "right"} child position is None. Attach ${value} there as a new leaf.`, codeLine: 2, frame: treeFrame(root, [], [], `New ${value < parent.value ? "LEFT" : "RIGHT"} child of ${parent.value}`, [...path.map((node) => node.value), value], { [inserted.id]: "entering" }, checked) });
    steps.push({ id: "bst-insert-complete", operation: "insert-complete", explanation: `${value} is inserted without moving any existing node. The BST rule still holds.`, codeLine: 7, frame: treeFrame(root, [], nodesBreadthFirst(root).map((node) => node.id), "Insertion complete", inorder(root).map((node) => node.value)) });
    return steps;
  },
};

function replaceNode(root: Node, node: Node, replacement: Node | null) {
  if (!node.parent) { if (replacement) replacement.parent = null; return replacement; }
  if (node.parent.left === node) node.parent.left = replacement; else node.parent.right = replacement;
  if (replacement) replacement.parent = node.parent;
  return root;
}

export const bstDeleteLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "bst-delete", title: "BST deletion", category: "algorithm",
  code: ["def delete(node, value):", "    if node is None: return None", "    if value < node.value:", "        node.left = delete(node.left, value)", "    elif value > node.value:", "        node.right = delete(node.right, value)", "    elif node.left is None:", "        return node.right", "    elif node.right is None:", "        return node.left", "    successor = minimum(node.right)", "    node.value = successor.value", "    node.right = delete(node.right, successor.value)", "    return node"],
  validate: ({ values, value }) => { const base = basicValidation(values); if (!base.valid) return base; return values.includes(value) ? { valid: true } : { valid: false, message: "Choose an existing value to delete." }; },
  createSteps: ({ values, value }) => {
    let root = buildBst(values)!; const path = findPath(root, value); const target = path.at(-1)!; const steps: VisualizationStep[] = [];
    path.forEach((node, index) => steps.push({ id: `bst-delete-find-${index}`, operation: "find-target", explanation: node === target ? `Found ${value}. Now inspect its children before changing links.` : `${value} is ${value < node.value ? "smaller" : "larger"} than ${node.value}; continue ${value < node.value ? "left" : "right"}.`, codeLine: node === target ? 6 : value < node.value ? 2 : 4, frame: treeFrame(root, [node.id], [], `Find ${value}`, path.slice(0, index + 1).map((item) => item.value), {}, path.slice(0, index).map((item) => item.id)) }));
    if (!target.left || !target.right) {
      const replacement = target.left ?? target.right;
      steps.push({ id: "bst-delete-case", operation: replacement ? "one-child-case" : "leaf-case", explanation: replacement ? `${value} has one child, ${replacement.value}. That child can take its place.` : `${value} is a leaf, so no descendants need reconnecting.`, codeLine: target.left ? 8 : 6, frame: treeFrame(root, [], [], replacement ? "One child moves up" : "Leaf has no children", [value], { [target.id]: "leaving", ...(replacement ? { [replacement.id]: "entering" as const } : {}) }) });
      root = replaceNode(root, target, replacement)!;
    } else {
      let successor = target.right; const successorPath = [successor];
      while (successor.left) { successor = successor.left; successorPath.push(successor); }
      steps.push({ id: "bst-delete-successor", operation: "find-successor", explanation: `${value} has two children. Use ${successor.value}, the smallest value in its right subtree, as its inorder successor.`, codeLine: 10, frame: treeFrame(root, [target.id, ...successorPath.map((node) => node.id)], [], `Successor: ${successor.value}`, [value, ...successorPath.map((node) => node.value)]) });
      target.value = successor.value;
      steps.push({ id: "bst-delete-copy", operation: "copy-successor", explanation: `Copy ${successor.value} into the target position. The original successor node is now the duplicate to remove.`, codeLine: 11, frame: treeFrame(root, [target.id], [], `Replace ${value} with ${successor.value}`, [successor.value], { [successor.id]: "leaving" }) });
      root = replaceNode(root, successor, successor.right)!;
    }
    const remaining = nodesBreadthFirst(root);
    steps.push({ id: "bst-delete-complete", operation: "delete-complete", explanation: `${value} is gone and all remaining left/right ordering relationships are valid.`, codeLine: 13, frame: treeFrame(root, [], remaining.map((node) => node.id), "Deletion complete", inorder(root).map((node) => node.value)) });
    return steps;
  },
};

function isMinHeap(values: number[]) {
  return values.every((value, index) => (index === 0 || values[Math.floor((index - 1) / 2)] <= value));
}

function heapItems(values: number[], active: number[] = [], completed: number[] = [], special: Record<number, "entering" | "leaving"> = {}): VisualItem[] {
  return values.map((value, index) => ({ id: `heap-${index}`, value, label: index === 0 ? "MIN ROOT" : index * 2 + 1 >= values.length ? "LEAF" : "NODE", parentId: index === 0 ? null : `heap-${Math.floor((index - 1) / 2)}`, edgeLabel: index === 0 ? undefined : index % 2 ? "left" : "right", state: special[index] ?? (active.includes(index) ? "active" : completed.includes(index) ? "completed" : "idle") }));
}

function heapFrame(values: number[], active: number[], caption: string, special: Record<number, "entering" | "leaving"> = {}, completed: number[] = []) {
  return { layout: "tree" as const, items: heapItems(values, active, completed, special), caption, output: [...values] };
}

function validateHeapInput(values: number[]) { const base = basicValidation(values); if (!base.valid) return base; return isMinHeap(values) ? { valid: true as const } : { valid: false as const, message: "Heap values must already satisfy parent ≤ child." }; }

export const heapInsertLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "heap-insert", title: "Min-heap insertion", category: "data-structure",
  code: ["def heappush(heap, value):", "    heap.append(value)", "    child = len(heap) - 1", "    while child > 0:", "        parent = (child - 1) // 2", "        if heap[parent] <= heap[child]: break", "        heap[parent], heap[child] = heap[child], heap[parent]", "        child = parent"],
  validate: ({ values, value }) => { const base = validateHeapInput(values); if (!base.valid) return base; return Number.isInteger(value) ? { valid: true } : { valid: false, message: "The new priority must be a whole number." }; },
  createSteps: ({ values: source, value }) => {
    const values = [...source]; const steps: VisualizationStep[] = [{ id: "heap-insert-0", operation: "inspect-min-heap", explanation: `${values[0]} is the minimum because every parent is no larger than its children.`, codeLine: 0, frame: heapFrame(values, [0], "Complete tree · minimum at root") }];
    values.push(value); let child = values.length - 1;
    steps.push({ id: "heap-insert-1", operation: "append-leaf", explanation: `Append ${value} in the next open position to keep the tree complete.`, codeLine: 1, frame: heapFrame(values, [], `Array index ${child} becomes the new leaf`, { [child]: "entering" }) }); let sequence = 2;
    while (child > 0) { const parent = Math.floor((child - 1) / 2); steps.push({ id: `heap-insert-${sequence++}`, operation: "compare-parent", explanation: `Compare child ${values[child]} with parent ${values[parent]}.`, codeLine: 5, frame: heapFrame(values, [parent, child], `Parent ${values[parent]} · child ${values[child]}`) }); if (values[parent] <= values[child]) break; [values[parent], values[child]] = [values[child], values[parent]]; steps.push({ id: `heap-insert-${sequence++}`, operation: "bubble-up", explanation: `Swap them because ${values[parent]} has the smaller priority. Continue upward.`, codeLine: 6, frame: heapFrame(values, [parent, child], `${values[parent]} moved toward the root`) }); child = parent; }
    steps.push({ id: "heap-insert-complete", operation: "insert-complete", explanation: `${value} is in place. Shape and min-heap ordering are both restored.`, codeLine: 7, frame: heapFrame(values, [], "Heap insertion complete", {}, values.map((_, index) => index)) }); return steps;
  },
};

export const heapExtractLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "heap-extract", title: "Extract minimum", category: "data-structure",
  code: ["def heappop(heap):", "    minimum = heap[0]", "    heap[0] = heap.pop()", "    parent = 0", "    while left_child(parent) < len(heap):", "        child = smaller_child(parent)", "        if heap[parent] <= heap[child]: break", "        heap[parent], heap[child] = heap[child], heap[parent]", "        parent = child", "    return minimum"],
  validate: ({ values }) => validateHeapInput(values),
  createSteps: ({ values: source }) => {
    const values = [...source]; const minimum = values[0]; const steps: VisualizationStep[] = [{ id: "heap-extract-0", operation: "read-minimum", explanation: `The minimum, ${minimum}, is available immediately at the root.`, codeLine: 1, frame: heapFrame(values, [0], `Return value will be ${minimum}`) }]; const last = values.at(-1)!;
    steps.push({ id: "heap-extract-1", operation: "move-last-to-root", explanation: `Remove ${minimum}, then move last value ${last} to the root so the tree stays complete.`, codeLine: 2, frame: heapFrame(values, [0, values.length - 1], `Replace root with final leaf`, { 0: "leaving", [values.length - 1]: "entering" }) }); values[0] = values.pop()!; let parent = 0; let sequence = 2;
    while (parent * 2 + 1 < values.length) { const left = parent * 2 + 1; const right = left + 1; const child = right < values.length && values[right] < values[left] ? right : left; steps.push({ id: `heap-extract-${sequence++}`, operation: "choose-smaller-child", explanation: `Compare available children and choose smaller child ${values[child]}.`, codeLine: 5, frame: heapFrame(values, [parent, left, ...(right < values.length ? [right] : [])], `Smaller child: ${values[child]}`) }); if (values[parent] <= values[child]) break; [values[parent], values[child]] = [values[child], values[parent]]; steps.push({ id: `heap-extract-${sequence++}`, operation: "sift-down", explanation: `Swap ${values[child]} downward and ${values[parent]} upward to restore parent ≤ child.`, codeLine: 7, frame: heapFrame(values, [parent, child], `${values[parent]} moved up`) }); parent = child; }
    steps.push({ id: "heap-extract-complete", operation: "extract-complete", explanation: `${minimum} was removed and the next minimum, ${values[0]}, is now at the root.`, codeLine: 9, frame: heapFrame(values, [], `Returned ${minimum}`, {}, values.map((_, index) => index)) }); return steps;
  },
};

function avlTree(rotation: RotationKind, balanced = false): Node {
  const a: Node = { id: "avl-10", value: 10, left: null, right: null, parent: null };
  const b: Node = { id: "avl-20", value: 20, left: null, right: null, parent: null };
  const c: Node = { id: "avl-30", value: 30, left: null, right: null, parent: null };
  if (balanced) { b.left = a; b.right = c; a.parent = b; c.parent = b; return b; }
  if (rotation === "ll") { c.left = b; b.parent = c; b.left = a; a.parent = b; return c; }
  if (rotation === "rr") { a.right = b; b.parent = a; b.right = c; c.parent = b; return a; }
  if (rotation === "lr") { c.left = a; a.parent = c; a.right = b; b.parent = a; return c; }
  a.right = c; c.parent = a; c.left = b; b.parent = c; return a;
}

function avlIntermediate(rotation: "lr" | "rl"): Node {
  const a: Node = { id: "avl-10", value: 10, left: null, right: null, parent: null };
  const b: Node = { id: "avl-20", value: 20, left: null, right: null, parent: null };
  const c: Node = { id: "avl-30", value: 30, left: null, right: null, parent: null };
  if (rotation === "lr") { c.left = b; b.parent = c; b.left = a; a.parent = b; return c; }
  a.right = b; b.parent = a; b.right = c; c.parent = b; return a;
}

export const avlBalanceLesson: LessonDefinition<AdvancedTreeInput> = {
  id: "avl-balance", title: "AVL balancing", category: "data-structure",
  code: ["def rebalance(node):", "    balance = height(node.left) - height(node.right)", "    if balance > 1:", "        if balance_factor(node.left) < 0:", "            node.left = rotate_left(node.left)", "        return rotate_right(node)", "    if balance < -1:", "        if balance_factor(node.right) > 0:", "            node.right = rotate_right(node.right)", "        return rotate_left(node)"],
  validate: ({ rotation }) => ["ll", "rr", "lr", "rl"].includes(rotation) ? { valid: true } : { valid: false, message: "Choose a valid AVL imbalance." },
  createSteps: ({ rotation }) => {
    const root = avlTree(rotation); const inserted = rotation === "ll" ? "avl-10" : rotation === "rr" ? "avl-30" : "avl-20"; const heavy = rotation === "ll" || rotation === "lr" ? "LEFT" : "RIGHT"; const isDouble = rotation === "lr" || rotation === "rl";
    const steps: VisualizationStep[] = [
      { id: "avl-0", operation: "detect-imbalance", explanation: `After insertion, the root is two levels heavier on the ${heavy}. Its balance factor is ${heavy === "LEFT" ? "+2" : "−2"}.`, codeLine: 1, frame: treeFrame(root, [root.id, inserted], [], `${rotation.toUpperCase()} imbalance · balance factor ${heavy === "LEFT" ? "+2" : "−2"}`, [`BF(root) = ${heavy === "LEFT" ? "+2" : "−2"}`], { [inserted]: "entering" }) },
    ];
    if (isDouble) {
      const intermediate = avlIntermediate(rotation);
      steps.push({ id: "avl-1", operation: "rotate-child", explanation: `${rotation.toUpperCase()} is a zig-zag shape, so first rotate the heavy child ${rotation === "lr" ? "left" : "right"}.`, codeLine: rotation === "lr" ? 4 : 8, frame: treeFrame(intermediate, ["avl-20", rotation === "lr" ? "avl-10" : "avl-30"], [], "First rotation straightens the zig-zag", [`Step 1: rotate ${rotation === "lr" ? "left" : "right"}`]) });
    }
    const balanced = avlTree(rotation, true);
    steps.push({ id: "avl-rotate-root", operation: rotation === "ll" || rotation === "lr" ? "rotate-right" : "rotate-left", explanation: `Rotate the unbalanced root ${rotation === "ll" || rotation === "lr" ? "right" : "left"}. The middle value, 20, becomes the new root.`, codeLine: rotation === "ll" || rotation === "lr" ? 5 : 9, frame: treeFrame(balanced, ["avl-20"], [], `Root rotation ${rotation === "ll" || rotation === "lr" ? "right" : "left"}`, [`New root = 20`], { "avl-20": "entering" }) });
    steps.push({ id: "avl-complete", operation: "balance-restored", explanation: "Every node now has balance factor −1, 0, or +1, while BST ordering remains unchanged.", codeLine: 1, frame: treeFrame(balanced, [], ["avl-10", "avl-20", "avl-30"], "Height restored to 1", ["BF(20) = 0", "BST order = 10, 20, 30"]) }); return steps;
  },
};

const usage = (summary: string, examples: string[], chooseWhen: string, avoidWhen: string, operations: [string, string][], practice: string): UsageGuide => ({ summary, examples, chooseWhen, avoidWhen, operations: operations.map(([name, cost]) => ({ name, cost })), practice });

export const advancedTreeMeta: Record<AdvancedTreeLessonId, AdvancedTreeMeta> = {
  "bst-rule": { id: "bst-rule", navLabel: "BST Rule", shortLabel: "<·>", title: "Binary Search Tree Rule", description: "Turn comparisons into structure: smaller values go left and larger values go right.", concept: "The ordering rule repeats inside every subtree.", rule: "left < node < right", analogy: "a branching number-guessing game", usage: usage("A BST keeps ordered keys in a linked structure that supports search and ordered traversal.", ["Ordered sets", "Symbol tables", "Range queries"], "You need ordered data, predecessor/successor operations, or range output.", "You only need direct key lookup; a hash table is usually simpler.", [["Balanced search", "O(log n)"], ["Worst search", "O(n)"], ["Inorder", "O(n)"]], "Insert the same values in a different order and compare tree heights.") },
  "bst-search": { id: "bst-search", navLabel: "BST Search", shortLabel: "?", title: "Search a BST", description: "Use each comparison to eliminate an entire left or right subtree.", concept: "Smaller goes left; larger goes right; equality stops.", rule: "One root-to-leaf path", analogy: "following signs in a decision maze", usage: usage("BST search preserves ordering features while narrowing the candidates at each node.", ["Ordered dictionary lookup", "Nearest-value queries", "Membership checks"], "The tree stays reasonably balanced and keys must remain ordered.", "The tree can become a long chain or ordering is unnecessary.", [["Average", "O(log n)"], ["Worst", "O(n)"], ["Space", "O(1)*"]], "Search for a missing value and explain the final None edge.") },
  "bst-insert": { id: "bst-insert", navLabel: "BST Insert", shortLabel: "+", title: "Insert into a BST", description: "Follow the comparison path until an empty child position becomes the new leaf.", concept: "Insertion searches for the one None link where the value belongs.", rule: "Existing nodes do not move", analogy: "filing a number into nested drawers", usage: usage("BST insertion maintains a dynamic ordered set without shifting an array.", ["Growing ordered indexes", "Event timelines", "In-memory maps"], "Values arrive over time and ordered queries matter.", "Input order is likely to create a severely skewed unbalanced tree.", [["Average", "O(log n)"], ["Worst", "O(n)"], ["Space", "O(h)*"]], "Predict where values smaller than every existing key will attach.") },
  "bst-delete": { id: "bst-delete", navLabel: "BST Delete", shortLabel: "−", title: "Delete from a BST", description: "Reconnect zero or one child directly; use an inorder successor when two subtrees must survive.", concept: "Deletion preserves every remaining ordering relationship.", rule: "0, 1, or 2-child case", analogy: "removing a manager without losing their teams", usage: usage("BST deletion maintains an ordered dynamic collection when keys are removed.", ["Mutable ordered sets", "Index maintenance", "Scheduling records"], "You need ongoing ordered insertion and removal.", "A simpler immutable or append-only structure is enough.", [["Average", "O(log n)"], ["Worst", "O(n)"], ["Reconnect", "O(1)"]], "Delete a leaf, a one-child node, and a two-child node.") },
  "heap-insert": { id: "heap-insert", navLabel: "Heap Insert", shortLabel: "↑", title: "Insert into a Min Heap", description: "Append at the next open slot, then bubble the value upward until parent priorities are valid.", concept: "Complete shape first; heap order second.", rule: "parent ≤ children", analogy: "a high-priority request moving up a support queue", usage: usage("A min heap makes the smallest priority immediately available while supporting fast updates.", ["Task schedulers", "Dijkstra frontiers", "Event simulation"], "You repeatedly need the smallest item, not complete sorted order.", "You need fast arbitrary search or ordered iteration.", [["Insert", "O(log n)"], ["Peek min", "O(1)"], ["Space", "O(n)"]], "Insert a new smallest value and count its swaps.") },
  "heap-extract": { id: "heap-extract", navLabel: "Extract Min", shortLabel: "↓", title: "Extract the Minimum", description: "Remove the root, preserve the complete shape, then sift the replacement downward.", concept: "The smaller child guides every downward repair.", rule: "return root · repair heap", analogy: "serving the next priority ticket", usage: usage("Extract-min powers priority queues by repeatedly returning the most urgent item.", ["Priority queues", "Shortest-path algorithms", "Deadline processing"], "You need repeated access to the current minimum.", "You need removal by arbitrary key rather than priority.", [["Extract", "O(log n)"], ["Peek", "O(1)"], ["Build", "O(n)"]], "Explain why the final leaf—not an arbitrary node—moves to the root.") },
  "avl-balance": { id: "avl-balance", navLabel: "AVL Rotations", shortLabel: "↻", title: "AVL Balance & Rotations", description: "Recognize four imbalance shapes and restore height with one or two local rotations.", concept: "Rotations change structure without changing sorted order.", rule: "balance factor ∈ {−1, 0, +1}", analogy: "rebalancing a mobile without changing its pieces", usage: usage("AVL trees keep search, insertion, and deletion logarithmic through strict height balancing.", ["Read-heavy indexes", "Ordered in-memory maps", "Latency-sensitive lookup"], "Predictable fast lookup matters more than minimizing update work.", "Updates dominate and looser balancing or a different index is preferable.", [["Search", "O(log n)"], ["Update", "O(log n)"], ["Rotation", "O(1)"]], "Identify whether each zig-zag needs one or two rotations.") },
};
