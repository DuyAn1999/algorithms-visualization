export type CurriculumModule = Readonly<{
  id: string;
  checkpoint: number;
  title: string;
  description: string;
  href: string;
  storageKey: string;
  lessonCount: number;
  lessonIds: readonly string[];
  topics: readonly string[];
}>;

export const curriculumModules: readonly CurriculumModule[] = [
  { id: "foundations", checkpoint: 3, title: "Foundations", description: "Build the mental models used by every later visualization.", href: "/", storageKey: "algolab-foundation-progress", lessonCount: 5, lessonIds: ["arrays","strings","matrices","recursion","big-o"], topics: ["Arrays", "Strings", "Matrices", "Recursion", "Big-O"] },
  { id: "linear", checkpoint: 4, title: "Linear data structures", description: "See how order, links, ends, and hashing organize data.", href: "/linear-structures", storageKey: "algolab-linear-progress", lessonCount: 8, lessonIds: ["singly-linked-list","doubly-linked-list","circular-linked-list","stack","queue","circular-queue","deque","hash-table"], topics: ["Linked lists", "Stack", "Queue", "Deque", "Hash table"] },
  { id: "sorting", checkpoint: 5, title: "Searching & sorting", description: "Compare how common algorithms inspect, rearrange, and narrow data.", href: "/sorting-searching", storageKey: "algolab-sorting-progress", lessonCount: 10, lessonIds: ["linear-search","binary-search","bubble-sort","selection-sort","insertion-sort","merge-sort","quick-sort","heap-sort","counting-sort","radix-sort"], topics: ["Linear search", "Binary search", "Six sorts", "Counting", "Radix"] },
  { id: "trees", checkpoint: 6, title: "Tree foundations", description: "Learn tree vocabulary and the four essential traversal orders.", href: "/tree-foundations", storageKey: "algolab-tree-progress", lessonCount: 6, lessonIds: ["general-tree","binary-tree","preorder","inorder","postorder","level-order"], topics: ["General tree", "Binary tree", "DFS orders", "Level order"] },
  { id: "search-trees", checkpoint: 7, title: "Search & priority trees", description: "Use ordering, heap shape, and rotations to keep operations efficient.", href: "/search-trees", storageKey: "algolab-advanced-tree-progress", lessonCount: 7, lessonIds: ["bst-rule","bst-search","bst-insert","bst-delete","heap-insert","heap-extract","avl-balance"], topics: ["BST", "Min-heap", "AVL balance", "Rotations"] },
  { id: "graphs", checkpoint: 8, title: "Graph foundations", description: "Represent networks and explore their vertices, edges, and dependencies.", href: "/graph-foundations", storageKey: "algolab-graph-progress", lessonCount: 7, lessonIds: ["graph-basics","adjacency-list","adjacency-matrix","bfs","dfs","components","topological-sort"], topics: ["Representations", "BFS", "DFS", "Components", "Topological sort"] },
  { id: "weighted", checkpoint: 9, title: "Weighted graphs", description: "Reason about costs, shortest paths, spanning trees, and connectivity.", href: "/weighted-graphs", storageKey: "algolab-weighted-progress", lessonCount: 7, lessonIds: ["weighted-basics","dijkstra","bellman-ford","floyd-warshall","prim","kruskal","union-find"], topics: ["Dijkstra", "Bellman–Ford", "Floyd–Warshall", "MST", "Union-Find"] },
  { id: "techniques", checkpoint: 10, title: "Algorithmic techniques", description: "Choose a problem-solving strategy and recognize when it applies.", href: "/algorithmic-techniques", storageKey: "algolab-technique-progress", lessonCount: 7, lessonIds: ["brute-force","divide-conquer","greedy","memoization","dynamic-programming","backtracking","sliding-window"], topics: ["Brute force", "Divide & conquer", "Greedy", "DP", "Backtracking"] },
];

export const totalCurriculumLessons = curriculumModules.reduce((total, module) => total + module.lessonCount, 0);

export function countStoredLessons(raw: string | null, lessonCount: number, allowedIds?: readonly string[]) {
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    const completed = new Set(parsed.filter((value): value is string => typeof value === "string" && (!allowedIds || allowedIds.includes(value))));
    return Math.min(completed.size, lessonCount);
  } catch {
    return 0;
  }
}

export function curriculumProgress(progress: Readonly<Record<string, number>>) {
  const completedLessons = curriculumModules.reduce((total, module) => total + Math.min(Math.max(progress[module.id] ?? 0, 0), module.lessonCount), 0);
  const completedModules = curriculumModules.filter((module) => (progress[module.id] ?? 0) >= module.lessonCount).length;
  const resumeModule = curriculumModules.find((module) => (progress[module.id] ?? 0) < module.lessonCount) ?? curriculumModules.at(-1)!;
  return { completedLessons, completedModules, resumeModule, percentage: Math.round((completedLessons / totalCurriculumLessons) * 100) };
}
