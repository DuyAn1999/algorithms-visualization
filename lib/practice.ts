import { curriculumModules } from "./curriculum.ts";

export type PracticeOption = Readonly<{ id: string; label: string }>;
export type PracticeQuestion = Readonly<{
  id: string;
  moduleId: string;
  topic: string;
  prompt: string;
  options: readonly PracticeOption[];
  answer: string;
  explanation: string;
  hint: string;
  reviewHref: string;
}>;
export type PracticeAttempt = Readonly<{ attempts: number; correctAttempts: number; lastCorrect: boolean; mastered: boolean }>;
export type PracticeProgress = Readonly<Record<string, PracticeAttempt>>;

const options = (...labels: string[]): PracticeOption[] => labels.map((label, index) => ({ id: String.fromCharCode(97 + index), label }));

export const practiceQuestions: readonly PracticeQuestion[] = [
  { id: "foundation-growth", moduleId: "foundations", topic: "Big-O", prompt: "An O(n) scan processes 100 values. If the input grows to 200 values, what should you expect?", options: options("About the same work", "About twice the work", "About four times the work", "Exactly one extra step"), answer: "b", explanation: "Linear growth means work scales in direct proportion to input size, so doubling n roughly doubles the operations.", hint: "Focus on what the n in O(n) represents.", reviewHref: "/" },
  { id: "foundation-matrix", moduleId: "foundations", topic: "Matrices", prompt: "What information identifies one cell in a two-dimensional matrix?", options: options("Only its value", "A row and a column", "A parent pointer", "A hash function"), answer: "b", explanation: "A matrix cell is addressed by two coordinates: its row index and its column index.", hint: "Imagine locating a seat in a theater.", reviewHref: "/" },
  { id: "linear-stack", moduleId: "linear", topic: "Stack", prompt: "Which rule makes a stack suitable for undo history?", options: options("First in, first out", "Smallest value first", "Last in, first out", "Random access first"), answer: "c", explanation: "Undo reverses the most recent action first, which is exactly the stack's last-in, first-out rule.", hint: "Which action should be reversed first?", reviewHref: "/linear-structures" },
  { id: "linear-queue", moduleId: "linear", topic: "Queue", prompt: "In a standard queue, where are values added and removed?", options: options("Add front, remove rear", "Add rear, remove front", "Add and remove middle", "Add and remove rear"), answer: "b", explanation: "Enqueue adds at the rear; dequeue removes the oldest value from the front.", hint: "Think of people joining and leaving a real line.", reviewHref: "/linear-structures" },
  { id: "sorting-binary", moduleId: "sorting", topic: "Binary Search", prompt: "What must be true before ordinary Binary Search can safely discard half the values?", options: options("Values must be unique", "Values must be positive", "Values must be sorted", "The list must have even length"), answer: "c", explanation: "Sorted order lets the middle comparison prove that one entire half cannot contain the target.", hint: "Why does the middle value reveal a direction?", reviewHref: "/sorting-searching" },
  { id: "sorting-merge", moduleId: "sorting", topic: "Merge Sort", prompt: "Which description best matches Merge Sort?", options: options("Swap neighboring inversions repeatedly", "Split, sort halves, then merge", "Select a pivot and partition in place", "Count each integer key"), answer: "b", explanation: "Merge Sort divides the list recursively, then combines two sorted halves with a linear merge.", hint: "Its name describes the combine step.", reviewHref: "/sorting-searching" },
  { id: "trees-inorder", moduleId: "trees", topic: "Inorder", prompt: "What does an inorder traversal of a valid Binary Search Tree produce?", options: options("Keys in sorted order", "Keys by tree level", "Only leaf keys", "Keys in insertion order"), answer: "a", explanation: "Inorder visits left subtree, node, then right subtree; the BST ordering rule makes that sequence sorted.", hint: "Combine left < node < right with the visit order.", reviewHref: "/tree-foundations" },
  { id: "trees-level", moduleId: "trees", topic: "Level order", prompt: "Which helper structure naturally supports level-order tree traversal?", options: options("Stack", "Queue", "Hash set only", "Min-heap"), answer: "b", explanation: "A queue preserves discovery order, so all nodes at one level are processed before the next level.", hint: "Level order is breadth-first traversal.", reviewHref: "/tree-foundations" },
  { id: "search-tree-heap", moduleId: "search-trees", topic: "Min-heap", prompt: "What guarantee does a min-heap give at its root?", options: options("The newest value", "The median value", "The minimum value", "A fully sorted array"), answer: "c", explanation: "The heap-order property keeps every parent no larger than its children, placing a minimum at the root.", hint: "The structure is named for the priority exposed first.", reviewHref: "/search-trees" },
  { id: "search-tree-avl", moduleId: "search-trees", topic: "AVL trees", prompt: "Why does an AVL tree perform rotations?", options: options("To sort duplicate values", "To restore height balance while preserving BST order", "To convert the tree into a heap", "To remove every leaf"), answer: "b", explanation: "Rotations change local shape without breaking key order, restoring the height bound needed for logarithmic operations.", hint: "A rotation changes shape, not the sorted relationship.", reviewHref: "/search-trees" },
  { id: "graphs-bfs", moduleId: "graphs", topic: "BFS", prompt: "Which algorithm finds shortest paths measured by edge count in an unweighted graph?", options: options("Depth-first search", "Breadth-first search", "Kruskal", "Heap Sort"), answer: "b", explanation: "BFS explores vertices in distance layers, so the first discovery uses the fewest unweighted edges.", hint: "Which traversal visits all distance-1 neighbors before distance-2 neighbors?", reviewHref: "/graph-foundations" },
  { id: "graphs-topological", moduleId: "graphs", topic: "Topological sort", prompt: "A complete topological ordering exists only when the directed graph has what property?", options: options("Every edge has a weight", "No directed cycle", "Exactly one source", "Every vertex has two neighbors"), answer: "b", explanation: "A directed cycle creates circular prerequisites, so no vertex order can place every dependency first.", hint: "Consider A before B, B before C, and C before A.", reviewHref: "/graph-foundations" },
  { id: "weighted-dijkstra", moduleId: "weighted", topic: "Dijkstra", prompt: "Which condition is required by the standard Dijkstra algorithm?", options: options("All edges have equal weight", "No edge weight is negative", "The graph is a tree", "Every vertex is connected to every other"), answer: "b", explanation: "A negative edge could later improve a distance already finalized, breaking Dijkstra's greedy settling rule.", hint: "Ask what could invalidate a settled distance later.", reviewHref: "/weighted-graphs" },
  { id: "weighted-mst", moduleId: "weighted", topic: "Minimum spanning trees", prompt: "What does a minimum spanning tree minimize?", options: options("The route from one source to every vertex", "The number of graph vertices", "The total weight needed to connect all vertices", "The weight of every original edge"), answer: "c", explanation: "An MST selects V−1 cycle-free edges whose total weight connects every vertex as cheaply as possible.", hint: "Think of building one low-cost network, not one shortest trip.", reviewHref: "/weighted-graphs" },
  { id: "techniques-dp", moduleId: "techniques", topic: "Dynamic programming", prompt: "Dynamic programming is especially useful when a problem has which two traits?", options: options("Random inputs and constant time", "Overlapping subproblems and optimal substructure", "Only one possible choice", "A sorted array and no recursion"), answer: "b", explanation: "DP stores repeated subproblem answers, then combines optimal smaller answers into larger ones.", hint: "What makes saved smaller answers reusable?", reviewHref: "/algorithmic-techniques" },
  { id: "techniques-backtracking", moduleId: "techniques", topic: "Backtracking", prompt: "What happens after a backtracking branch reaches a dead end?", options: options("The whole program always stops", "The latest choice is undone and another branch is tried", "Every previous result is deleted", "The input is sorted"), answer: "b", explanation: "Backtracking restores the previous partial state, then explores the next available choice.", hint: "The technique's name describes the recovery action.", reviewHref: "/algorithmic-techniques" },
];

const questionIds = new Set(practiceQuestions.map((question) => question.id));

export function recordPracticeAnswer(progress: PracticeProgress, questionId: string, correct: boolean): PracticeProgress {
  const previous = progress[questionId] ?? { attempts: 0, correctAttempts: 0, lastCorrect: false, mastered: false };
  return { ...progress, [questionId]: { attempts: previous.attempts + 1, correctAttempts: previous.correctAttempts + (correct ? 1 : 0), lastCorrect: correct, mastered: previous.mastered || correct } };
}

export function parsePracticeProgress(raw: string | null): PracticeProgress {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, value]) => questionIds.has(id) && value && typeof value === "object" && Number.isInteger((value as PracticeAttempt).attempts) && (value as PracticeAttempt).attempts > 0).map(([id, value]) => { const attempt = value as PracticeAttempt; const attempts = Math.max(1, attempt.attempts); const correctAttempts = Math.min(Math.max(Number.isInteger(attempt.correctAttempts) ? attempt.correctAttempts : 0, 0), attempts); return [id, { attempts, correctAttempts, lastCorrect: Boolean(attempt.lastCorrect), mastered: Boolean(attempt.mastered) || correctAttempts > 0 }]; }));
  } catch { return {}; }
}

export function practiceSummary(progress: PracticeProgress) {
  const attempts = practiceQuestions.reduce((total, question) => total + (progress[question.id]?.attempts ?? 0), 0);
  const correctAttempts = practiceQuestions.reduce((total, question) => total + (progress[question.id]?.correctAttempts ?? 0), 0);
  const attemptedQuestions = practiceQuestions.filter((question) => progress[question.id]).length;
  const masteredQuestions = practiceQuestions.filter((question) => progress[question.id]?.mastered).length;
  const modules = Object.fromEntries(curriculumModules.map((module) => { const questions = practiceQuestions.filter((question) => question.moduleId === module.id); const mastered = questions.filter((question) => progress[question.id]?.mastered).length; const attempted = questions.filter((question) => progress[question.id]).length; return [module.id, { total: questions.length, attempted, mastered }]; }));
  const masteredModules = curriculumModules.filter((module) => modules[module.id].mastered === modules[module.id].total).length;
  return { attempts, correctAttempts, attemptedQuestions, masteredQuestions, masteredModules, accuracy: attempts ? Math.round(correctAttempts / attempts * 100) : 0, modules };
}
