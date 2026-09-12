import type { UsageGuide } from "./foundations.ts";
import type { LessonDefinition, VisualizationStep, VisualItem } from "../visualization/types.ts";

export type TreeLessonId =
  | "general-tree"
  | "binary-tree"
  | "preorder"
  | "inorder"
  | "postorder"
  | "level-order";

export type TreeInput = { values: number[]; selectedIndex: number };

export type TreeMeta = Readonly<{
  id: TreeLessonId;
  navLabel: string;
  shortLabel: string;
  title: string;
  description: string;
  concept: string;
  rule: string;
  analogy: string;
  usage: UsageGuide;
}>;

const generalParents: Array<number | null> = [null, 0, 0, 0, 1, 1, 2];

function validateTree({ values, selectedIndex }: TreeInput) {
  if (values.length < 3 || values.length > 7) return { valid: false as const, message: "Use 3 to 7 tree values." };
  if (!values.every(Number.isInteger)) return { valid: false as const, message: "Tree values must be whole numbers." };
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= values.length) return { valid: false as const, message: "Choose a node that exists." };
  return { valid: true as const };
}

function parentsFor(kind: "general" | "binary", length: number) {
  return Array.from({ length }, (_, index) => kind === "general" ? generalParents[index] : index === 0 ? null : Math.floor((index - 1) / 2));
}

function treeItems(
  values: number[],
  kind: "general" | "binary",
  active: number[] = [],
  completed: number[] = [],
  muted: number[] = [],
): VisualItem[] {
  const parents = parentsFor(kind, values.length);
  return values.map((value, index) => {
    const childCount = parents.filter((parent) => parent === index).length;
    const isBinaryLeft = index > 0 && index % 2 === 1;
    return {
      id: `tree-${index}`,
      value,
      label: index === 0 ? "ROOT" : childCount === 0 ? "LEAF" : "PARENT",
      parentId: parents[index] === null ? null : `tree-${parents[index]}`,
      edgeLabel: kind === "binary" && index > 0 ? (isBinaryLeft ? "left" : "right") : index > 0 ? "child" : undefined,
      state: active.includes(index) ? "active" : completed.includes(index) ? "completed" : muted.includes(index) ? "muted" : "idle",
    };
  });
}

function frame(values: number[], kind: "general" | "binary", active: number[], completed: number[], caption: string, output: number[] = [], muted: number[] = []) {
  return { layout: "tree" as const, items: treeItems(values, kind, active, completed, muted), caption, output };
}

export const generalTreeLesson: LessonDefinition<TreeInput> = {
  id: "general-tree", title: "General tree vocabulary", category: "data-structure",
  code: [
    "class TreeNode:", "    def __init__(self, value):", "        self.value = value", "        self.children = []", "", "def add_child(parent, child):", "    parent.children.append(child)",
  ],
  validate: validateTree,
  createSteps: ({ values, selectedIndex }) => {
    const parents = parentsFor("general", values.length);
    const parent = parents[selectedIndex];
    const children = values.map((_, index) => index).filter((index) => parents[index] === selectedIndex);
    const siblings = parent === null ? [] : values.map((_, index) => index).filter((index) => parents[index] === parent && index !== selectedIndex);
    return [
      { id: "general-0", operation: "find-root", explanation: `${values[0]} is the root—the one node with no parent. Every path starts here.`, codeLine: 0, frame: frame(values, "general", [0], [], "A hierarchy grows downward from one root") },
      { id: "general-1", operation: "inspect-parent", explanation: selectedIndex === 0 ? "The selected root has no parent." : `${values[selectedIndex]}'s parent is ${values[parent!]}. The connecting line is an edge.`, codeLine: 5, frame: frame(values, "general", parent === null ? [0] : [parent, selectedIndex], [], parent === null ? "ROOT has no parent" : `Parent ${values[parent]} → child ${values[selectedIndex]}`) },
      { id: "general-2", operation: "inspect-children", explanation: children.length ? `${values[selectedIndex]} has ${children.length} direct ${children.length === 1 ? "child" : "children"}: ${children.map((index) => values[index]).join(", ")}.` : `${values[selectedIndex]} has no children, so it is a leaf.`, codeLine: 3, frame: frame(values, "general", [selectedIndex, ...children], [], children.length ? "Children are one edge below their parent" : "A leaf ends a branch") },
      { id: "general-3", operation: "inspect-siblings", explanation: siblings.length ? `${values[selectedIndex]} shares a parent with ${siblings.map((index) => values[index]).join(", ")}; these nodes are siblings.` : "This selected node has no siblings in the current tree.", codeLine: 6, frame: frame(values, "general", [selectedIndex, ...siblings], [], "Siblings have the same direct parent") },
      { id: "general-4", operation: "structure-ready", explanation: "Unlike a list, one node may lead to several children. That branching creates a hierarchy.", codeLine: 6, frame: frame(values, "general", [], values.map((_, index) => index), "Root · parent · child · sibling · leaf") },
    ];
  },
};

export const binaryTreeLesson: LessonDefinition<TreeInput> = {
  id: "binary-tree", title: "Binary tree structure", category: "data-structure",
  code: [
    "class BinaryNode:", "    def __init__(self, value):", "        self.value = value", "        self.left = None", "        self.right = None", "", "parent.left = left_child", "parent.right = right_child",
  ],
  validate: validateTree,
  createSteps: ({ values, selectedIndex }) => {
    const left = selectedIndex * 2 + 1;
    const right = selectedIndex * 2 + 2;
    const parent = selectedIndex === 0 ? null : Math.floor((selectedIndex - 1) / 2);
    const children = [left, right].filter((index) => index < values.length);
    const depth = Math.floor(Math.log2(selectedIndex + 1));
    return [
      { id: "binary-0", operation: "inspect-rule", explanation: "A binary node has at most two child positions: LEFT and RIGHT.", codeLine: 3, frame: frame(values, "binary", [0], [], "Each edge is labeled left or right") },
      { id: "binary-1", operation: "inspect-node", explanation: `${values[selectedIndex]} is at depth ${depth}: ${depth} edge${depth === 1 ? "" : "s"} below the root.`, codeLine: 2, frame: frame(values, "binary", [selectedIndex], [], `Selected node ${values[selectedIndex]} · depth ${depth}`) },
      { id: "binary-2", operation: "inspect-parent", explanation: parent === null ? `${values[selectedIndex]} is the root, so it has no parent.` : `${values[parent]} is the parent of ${values[selectedIndex]}.`, codeLine: selectedIndex % 2 === 1 ? 6 : 7, frame: frame(values, "binary", parent === null ? [selectedIndex] : [parent, selectedIndex], [], parent === null ? "No edge enters the root" : "Follow one edge upward to the parent") },
      { id: "binary-3", operation: "inspect-children", explanation: children.length ? `${values[selectedIndex]} connects to ${children.map((index) => values[index]).join(" and ")}. Missing positions remain None.` : `${values[selectedIndex]} has no children and is therefore a leaf.`, codeLine: children.length ? 7 : 4, frame: frame(values, "binary", [selectedIndex, ...children], [], children.length ? "At most one LEFT and one RIGHT child" : "Both child references are None") },
      { id: "binary-4", operation: "structure-ready", explanation: `The longest root-to-leaf path has ${Math.floor(Math.log2(values.length))} edges, which is this tree's height.`, codeLine: 4, frame: frame(values, "binary", [], values.map((_, index) => index), `Tree height: ${Math.floor(Math.log2(values.length))}`) },
    ];
  },
};

const traversalCode = {
  preorder: ["def preorder(node):", "    if node is None:", "        return", "    visit(node.value)", "    preorder(node.left)", "    preorder(node.right)"],
  inorder: ["def inorder(node):", "    if node is None:", "        return", "    inorder(node.left)", "    visit(node.value)", "    inorder(node.right)"],
  postorder: ["def postorder(node):", "    if node is None:", "        return", "    postorder(node.left)", "    postorder(node.right)", "    visit(node.value)"],
} as const;

function traversalOrder(kind: "preorder" | "inorder" | "postorder", length: number) {
  const order: number[] = [];
  const walk = (index: number) => {
    if (index >= length) return;
    if (kind === "preorder") order.push(index);
    walk(index * 2 + 1);
    if (kind === "inorder") order.push(index);
    walk(index * 2 + 2);
    if (kind === "postorder") order.push(index);
  };
  walk(0);
  return order;
}

function traversalLesson(kind: "preorder" | "inorder" | "postorder", title: string): LessonDefinition<TreeInput> {
  const visitLine = kind === "preorder" ? 3 : kind === "inorder" ? 4 : 5;
  return {
    id: kind, title, category: "algorithm", code: traversalCode[kind], validate: validateTree,
    createSteps: ({ values }) => {
      const order = traversalOrder(kind, values.length);
      const output: number[] = [];
      const steps: VisualizationStep[] = [{ id: `${kind}-0`, operation: "start-traversal", explanation: `${title} is depth-first: follow one branch as far as possible before returning.`, codeLine: 0, frame: frame(values, "binary", [0], [], `Order rule: ${kind === "preorder" ? "node → left → right" : kind === "inorder" ? "left → node → right" : "left → right → node"}`) }];
      order.forEach((index, stepIndex) => {
        output.push(values[index]);
        steps.push({ id: `${kind}-${stepIndex + 1}`, operation: "visit-node", explanation: `Visit ${values[index]} now and append it to the output.`, codeLine: visitLine, frame: frame(values, "binary", [index], order.slice(0, stepIndex), `Visited ${output.length} of ${values.length} nodes`, [...output]) });
      });
      steps.push({ id: `${kind}-complete`, operation: "traversal-complete", explanation: `Every node was visited exactly once. ${title} is complete.`, codeLine: visitLine, frame: frame(values, "binary", [], order, "Traversal complete", [...output]) });
      return steps;
    },
  };
}

export const preorderLesson = traversalLesson("preorder", "Preorder traversal");
export const inorderLesson = traversalLesson("inorder", "Inorder traversal");
export const postorderLesson = traversalLesson("postorder", "Postorder traversal");

export const levelOrderLesson: LessonDefinition<TreeInput> = {
  id: "level-order", title: "Level-order traversal", category: "algorithm",
  code: [
    "from collections import deque", "", "def level_order(root):", "    queue = deque([root])", "    while queue:", "        node = queue.popleft()", "        visit(node.value)", "        if node.left: queue.append(node.left)", "        if node.right: queue.append(node.right)",
  ],
  validate: validateTree,
  createSteps: ({ values }) => {
    const queue = [0]; const visited: number[] = []; const output: number[] = []; const steps: VisualizationStep[] = [{ id: "level-0", operation: "enqueue-root", explanation: `Put root ${values[0]} into a queue. The queue keeps nodes in first-in, first-out order.`, codeLine: 3, frame: frame(values, "binary", [0], [], `Queue: ${values[0]}`) }]; let sequence = 1;
    while (queue.length) {
      const index = queue.shift()!;
      output.push(values[index]);
      steps.push({ id: `level-${sequence++}`, operation: "dequeue-and-visit", explanation: `Remove ${values[index]} from the front and visit it.`, codeLine: 6, frame: frame(values, "binary", [index], visited, `Queue after removal: ${queue.map((queued) => values[queued]).join(" → ") || "empty"}`, [...output]) });
      visited.push(index);
      const children = [index * 2 + 1, index * 2 + 2].filter((child) => child < values.length);
      if (children.length) {
        queue.push(...children);
        steps.push({ id: `level-${sequence++}`, operation: "enqueue-children", explanation: `Add ${children.map((child) => values[child]).join(" then ")} to the rear of the queue.`, codeLine: children.length === 2 ? 8 : 7, frame: frame(values, "binary", children, visited, `Queue: ${queue.map((queued) => values[queued]).join(" → ")}`, [...output]) });
      }
    }
    steps.push({ id: "level-complete", operation: "traversal-complete", explanation: "The queue is empty. Every level was visited from left to right.", codeLine: 4, frame: frame(values, "binary", [], visited, "Level-order traversal complete", [...output]) });
    return steps;
  },
};

const usage = (summary: string, examples: string[], chooseWhen: string, avoidWhen: string, operations: [string, string][], practice: string): UsageGuide => ({ summary, examples, chooseWhen, avoidWhen, operations: operations.map(([name, cost]) => ({ name, cost })), practice });

export const treeMeta: Record<TreeLessonId, TreeMeta> = {
  "general-tree": { id: "general-tree", navLabel: "General Trees", shortLabel: "T", title: "General Trees & Vocabulary", description: "Learn the relationships that make a hierarchy: root, parent, child, sibling, leaf, edge, depth, and height.", concept: "A tree branches from one root into parent-and-child relationships.", rule: "One parent · many children", analogy: "a family tree or folder system", usage: usage("General trees represent information that naturally branches into nested groups.", ["Folder systems", "Organization charts", "HTML document trees"], "Each item can contain several nested items and cycles are not allowed.", "Connections form arbitrary networks or every item simply follows one next item.", [["Visit all", "O(n)"], ["Store", "O(n)"], ["Find", "O(n)*"]], "Label the root, leaves, siblings, depth, and height of a new tree.") },
  "binary-tree": { id: "binary-tree", navLabel: "Binary Trees", shortLabel: "2", title: "Binary Tree Structure", description: "See how explicit left and right child positions create a predictable branching shape.", concept: "Every node owns at most a LEFT reference and a RIGHT reference.", rule: "0, 1, or 2 children", analogy: "a sequence of yes-or-no decisions", usage: usage("Binary trees are a structural base for search trees, heaps, expression trees, and coding trees.", ["Expression parsing", "Decision trees", "Huffman coding"], "Each decision or relationship naturally has at most two branches.", "Nodes need many direct children; a general tree is clearer.", [["Visit all", "O(n)"], ["Height", "O(n)*"] , ["Space", "O(n)"]], "For index i, calculate child indices 2i+1 and 2i+2.") },
  preorder: { id: "preorder", navLabel: "Preorder DFS", shortLabel: "NLR", title: "Preorder Traversal", description: "Visit each node before exploring its left and right subtrees.", concept: "NODE first, then LEFT subtree, then RIGHT subtree.", rule: "N → L → R", analogy: "copying a folder before its contents", usage: usage("Preorder records a hierarchy before its descendants and is useful for serialization.", ["Tree serialization", "Prefix expressions", "Copying hierarchies"], "A parent must be processed before any child.", "Children must be processed before their parent.", [["Time", "O(n)"], ["Stack", "O(h)"], ["Visits", "n"]], "Rebuild a tree from preorder plus inorder output.") },
  inorder: { id: "inorder", navLabel: "Inorder DFS", shortLabel: "LNR", title: "Inorder Traversal", description: "Explore the left subtree, visit the node, then explore the right subtree.", concept: "LEFT subtree first, then NODE, then RIGHT subtree.", rule: "L → N → R", analogy: "reading values between two bookends", usage: usage("Inorder has a special power on binary search trees: it returns keys in sorted order.", ["Sorted BST output", "Infix expressions", "Order validation"], "The left-node-right relationship carries meaning.", "The structure is not binary or parents must be processed first.", [["Time", "O(n)"], ["Stack", "O(h)"], ["Visits", "n"]], "Predict the output after swapping one left and right child.") },
  postorder: { id: "postorder", navLabel: "Postorder DFS", shortLabel: "LRN", title: "Postorder Traversal", description: "Finish both subtrees before visiting their parent node.", concept: "LEFT subtree, RIGHT subtree, then NODE last.", rule: "L → R → N", analogy: "packing children before closing their parent box", usage: usage("Postorder processes dependencies or descendants before the object that owns them.", ["Deleting directory trees", "Expression evaluation", "Folder-size totals"], "A parent depends on results from all its children.", "A parent must be available before processing children.", [["Time", "O(n)"], ["Stack", "O(h)"], ["Visits", "n"]], "Use child results to calculate every subtree's size.") },
  "level-order": { id: "level-order", navLabel: "Level-order BFS", shortLabel: "BFS", title: "Level-order Traversal", description: "Use a queue to visit the root, then each level from left to right.", concept: "The queue remembers which nearby node should be visited next.", rule: "Level by level · uses queue", analogy: "serving one floor of a building at a time", usage: usage("Level-order reveals distance from the root and finds shallow results before deeper ones.", ["Shortest unweighted tree path", "Level summaries", "Tree serialization"], "You need nodes grouped by depth or the nearest match first.", "You need to finish a deep branch before visiting siblings.", [["Time", "O(n)"], ["Queue", "O(w)"], ["Visits", "n"]], "Record where one level ends and the next begins.") },
};
