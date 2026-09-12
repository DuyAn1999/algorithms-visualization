import type { UsageGuide } from "./foundations.ts";
import type { LessonDefinition, VisualizationStep, VisualEdge, VisualItem } from "../visualization/types.ts";

export type GraphLessonId = "graph-basics" | "adjacency-list" | "adjacency-matrix" | "bfs" | "dfs" | "components" | "topological-sort";
export type GraphEdgeInput = { from: string; to: string };
export type GraphInput = { nodes: string[]; edges: GraphEdgeInput[]; start: string };
export type GraphMeta = Readonly<{ id: GraphLessonId; navLabel: string; shortLabel: string; title: string; description: string; concept: string; rule: string; analogy: string; usage: UsageGuide }>;

function validateGraph(input: GraphInput, requireDag = false) {
  const { nodes, edges, start } = input;
  if (nodes.length < 3 || nodes.length > 7) return { valid: false as const, message: "Use 3 to 7 vertices." };
  if (new Set(nodes).size !== nodes.length || nodes.some((node) => !/^[A-Z0-9]{1,3}$/.test(node))) return { valid: false as const, message: "Use unique 1–3 character vertex labels." };
  if (!nodes.includes(start)) return { valid: false as const, message: "The start vertex must exist." };
  if (!edges.length || edges.some((edge) => !nodes.includes(edge.from) || !nodes.includes(edge.to) || edge.from === edge.to)) return { valid: false as const, message: "Every edge must connect two different listed vertices." };
  const keys = edges.map((edge) => requireDag ? `${edge.from}>${edge.to}` : [edge.from, edge.to].sort().join("-"));
  if (new Set(keys).size !== keys.length) return { valid: false as const, message: "Remove duplicate edges." };
  if (requireDag && !topologicalOrder(input)) return { valid: false as const, message: "Topological Sort requires a directed graph with no cycle." };
  return { valid: true as const };
}

function adjacency(input: GraphInput, directed = false) {
  const map = new Map(input.nodes.map((node) => [node, [] as string[]]));
  for (const edge of input.edges) { map.get(edge.from)!.push(edge.to); if (!directed) map.get(edge.to)!.push(edge.from); }
  return map;
}

function edgeId(index: number) { return `graph-edge-${index}`; }
function edgeBetween(input: GraphInput, from: string, to: string, directed = false) {
  const index = input.edges.findIndex((edge) => edge.from === from && edge.to === to || (!directed && edge.from === to && edge.to === from));
  return index < 0 ? "" : edgeId(index);
}

function nodeItems(nodes: string[], active: string[] = [], completed: string[] = [], entering: string[] = [], muted: string[] = [], labels: Record<string, string> = {}): VisualItem[] {
  return nodes.map((node) => ({ id: `graph-${node}`, value: node, label: labels[node] ?? "VERTEX", state: active.includes(node) ? "active" : entering.includes(node) ? "entering" : completed.includes(node) ? "completed" : muted.includes(node) ? "muted" : "idle" }));
}

function visualEdges(input: GraphInput, directed: boolean, active: string[] = [], completed: string[] = [], muted: string[] = []): VisualEdge[] {
  return input.edges.map((edge, index) => { const id = edgeId(index); return { id, from: `graph-${edge.from}`, to: `graph-${edge.to}`, directed, state: active.includes(id) ? "active" : completed.includes(id) ? "completed" : muted.includes(id) ? "muted" : "idle" }; });
}

function graphFrame(input: GraphInput, directed: boolean, activeNodes: string[], completedNodes: string[], caption: string, output: Array<string | number> = [], activeEdges: string[] = [], completedEdges: string[] = [], enteringNodes: string[] = [], mutedEdges: string[] = [], labels: Record<string, string> = {}) {
  return { layout: "graph" as const, items: nodeItems(input.nodes, activeNodes, completedNodes, enteringNodes, [], labels), edges: visualEdges(input, directed, activeEdges, completedEdges, mutedEdges), caption, output };
}

function breadthFirstPath(input: GraphInput, start: string) {
  const neighbors = adjacency(input); const queue = [start]; const parent = new Map<string, string | null>([[start, null]]); let farthest = start;
  while (queue.length) { const current = queue.shift()!; farthest = current; for (const next of neighbors.get(current)!) if (!parent.has(next)) { parent.set(next, current); queue.push(next); } }
  const path: string[] = []; let current: string | null = farthest; while (current) { path.unshift(current); current = parent.get(current) ?? null; } return path;
}

export const graphBasicsLesson: LessonDefinition<GraphInput> = {
  id: "graph-basics", title: "Graph vocabulary", category: "data-structure",
  code: ["vertices = {'A', 'B', 'C', 'D'}", "edges = {('A', 'B'), ('A', 'C')}", "", "# degree = number of incident edges", "# path = connected sequence of vertices"],
  validate: (input) => validateGraph(input),
  createSteps: (input) => {
    const firstEdge = input.edges[0]; const neighbors = adjacency(input).get(input.start)!; const incident = input.edges.map((_, index) => edgeId(index)).filter((id, index) => input.edges[index].from === input.start || input.edges[index].to === input.start); const path = breadthFirstPath(input, input.start); const pathEdges = path.slice(1).map((node, index) => edgeBetween(input, path[index], node));
    return [
      { id: "graph-basics-0", operation: "identify-vertices", explanation: `A graph begins with ${input.nodes.length} vertices—the labeled points that represent objects.`, codeLine: 0, frame: graphFrame(input, false, input.nodes, [], "Vertices are objects or locations") },
      { id: "graph-basics-1", operation: "identify-edge", explanation: `The line between ${firstEdge.from} and ${firstEdge.to} is an undirected edge: connection works both ways.`, codeLine: 1, frame: graphFrame(input, false, [firstEdge.from, firstEdge.to], [], `${firstEdge.from} — ${firstEdge.to}`, [], [edgeId(0)]) },
      { id: "graph-basics-2", operation: "measure-degree", explanation: `${input.start} has degree ${neighbors.length} because ${neighbors.length} edge${neighbors.length === 1 ? " touches" : "s touch"} it.`, codeLine: 3, frame: graphFrame(input, false, [input.start, ...neighbors], [], `degree(${input.start}) = ${neighbors.length}`, neighbors, incident) },
      { id: "graph-basics-3", operation: "trace-path", explanation: `${path.join(" → ")} is a path: each consecutive pair shares an edge.`, codeLine: 4, frame: graphFrame(input, false, path, [], "A path connects vertices through edges", path, pathEdges) },
      { id: "graph-basics-4", operation: "graph-ready", explanation: "Graphs model relationships without requiring a root, parent, or single direction of travel.", codeLine: 4, frame: graphFrame(input, false, [], input.nodes, `${input.nodes.length} vertices · ${input.edges.length} edges`, input.nodes, [], input.edges.map((_, index) => edgeId(index))) },
    ];
  },
};

export const adjacencyListLesson: LessonDefinition<GraphInput> = {
  id: "adjacency-list", title: "Adjacency list", category: "data-structure",
  code: ["graph = {", "    'A': ['B', 'C'],", "    'B': ['A', 'D'],", "    # one neighbor list per vertex", "}", "neighbors = graph[vertex]"],
  validate: (input) => validateGraph(input),
  createSteps: (input) => {
    const lists = adjacency(input); const steps: VisualizationStep[] = [{ id: "list-0", operation: "make-lists", explanation: "Create one row for every vertex, even if that vertex has no neighbors.", codeLine: 0, frame: { layout: "adjacency-list", items: input.nodes.map((node) => ({ id: `list-${node}`, value: lists.get(node)!.join(" → ") || "∅", label: `vertex ${node}`, state: "idle" })), caption: "Vertex → direct neighbors" } }];
    input.nodes.forEach((node, index) => steps.push({ id: `list-${index + 1}`, operation: "read-neighbors", explanation: `${node}'s row stores ${lists.get(node)!.length ? lists.get(node)!.join(", ") : "no neighbors"}. Undirected edges appear in both endpoint lists.`, codeLine: 5, frame: { layout: "adjacency-list", items: input.nodes.map((item) => ({ id: `list-${item}`, value: lists.get(item)!.join(" → ") || "∅", label: `vertex ${item}`, state: item === node ? "active" : input.nodes.indexOf(item) < index ? "completed" : "idle" })), caption: `Reading graph[${node}]` } }));
    steps.push({ id: "list-complete", operation: "representation-ready", explanation: "The adjacency list stores only existing connections, making it compact for sparse graphs.", codeLine: 5, frame: { layout: "adjacency-list", items: input.nodes.map((node) => ({ id: `list-${node}`, value: lists.get(node)!.join(" → ") || "∅", label: `vertex ${node}`, state: "completed" })), caption: `${input.edges.length * 2} undirected neighbor entries` } }); return steps;
  },
};

function matrixItems(input: GraphInput, activeRow = -1, completedRows: number[] = []): VisualItem[] {
  const connected = new Set<string>(); for (const edge of input.edges) { connected.add(`${edge.from}-${edge.to}`); connected.add(`${edge.to}-${edge.from}`); }
  return input.nodes.flatMap((row, rowIndex) => input.nodes.map((column, columnIndex) => ({ id: `matrix-${row}-${column}`, value: connected.has(`${row}-${column}`) ? 1 : 0, label: `${row} → ${column}`, state: rowIndex === activeRow ? "active" as const : completedRows.includes(rowIndex) ? "completed" as const : rowIndex === columnIndex ? "muted" as const : "idle" as const })));
}

export const adjacencyMatrixLesson: LessonDefinition<GraphInput> = {
  id: "adjacency-matrix", title: "Adjacency matrix", category: "data-structure",
  code: ["matrix = [[0] * n for _ in range(n)]", "for start, end in edges:", "    matrix[start][end] = 1", "    matrix[end][start] = 1", "", "connected = matrix[u][v] == 1"],
  validate: (input) => validateGraph(input),
  createSteps: (input) => {
    const steps: VisualizationStep[] = [{ id: "matrix-graph-0", operation: "make-grid", explanation: `Create a ${input.nodes.length} × ${input.nodes.length} grid. Every row-column pair asks whether two vertices connect.`, codeLine: 0, frame: { layout: "matrix", columns: input.nodes.length, items: matrixItems(input), caption: `Rows and columns: ${input.nodes.join(", ")}` } }];
    input.nodes.forEach((node, index) => steps.push({ id: `matrix-graph-${index + 1}`, operation: "read-row", explanation: `Row ${node} marks each direct connection from ${node} with 1; absent edges stay 0.`, codeLine: 5, frame: { layout: "matrix", columns: input.nodes.length, items: matrixItems(input, index, Array.from({ length: index }, (_, row) => row)), caption: `Row ${node} · neighbors encoded as 1` } }));
    steps.push({ id: "matrix-graph-complete", operation: "representation-ready", explanation: "The mirrored grid makes any edge lookup constant-time, but reserves space for every possible pair.", codeLine: 5, frame: { layout: "matrix", columns: input.nodes.length, items: matrixItems(input, -1, input.nodes.map((_, index) => index)), caption: `${input.nodes.length ** 2} matrix cells` } }); return steps;
  },
};

export const bfsLesson: LessonDefinition<GraphInput> = {
  id: "bfs", title: "Breadth-first search", category: "algorithm",
  code: ["from collections import deque", "", "def bfs(graph, start):", "    queue = deque([start])", "    seen = {start}", "    while queue:", "        vertex = queue.popleft()", "        visit(vertex)", "        for neighbor in graph[vertex]:", "            if neighbor not in seen:", "                seen.add(neighbor)", "                queue.append(neighbor)"],
  validate: (input) => validateGraph(input),
  createSteps: (input) => {
    const neighbors = adjacency(input); const queue = [input.start]; const discovered = new Set([input.start]); const output: string[] = []; const treeEdges: string[] = []; const steps: VisualizationStep[] = [{ id: "bfs-0", operation: "enqueue-start", explanation: `Put ${input.start} in the queue and mark it discovered immediately.`, codeLine: 4, frame: graphFrame(input, false, [input.start], [], `Queue: ${input.start}`, [], [], [], [input.start]) }]; let sequence = 1;
    while (queue.length) { const current = queue.shift()!; output.push(current); steps.push({ id: `bfs-${sequence++}`, operation: "dequeue-visit", explanation: `Remove ${current} from the front and visit it.`, codeLine: 7, frame: graphFrame(input, false, [current], output.slice(0, -1), `Queue after removal: ${queue.join(" → ") || "empty"}`, [...output], [], treeEdges) }); for (const next of neighbors.get(current)!) if (!discovered.has(next)) { discovered.add(next); queue.push(next); const edge = edgeBetween(input, current, next); treeEdges.push(edge); steps.push({ id: `bfs-${sequence++}`, operation: "discover-neighbor", explanation: `${next} is new. Mark it now and add it to the rear so it cannot be queued twice.`, codeLine: 11, frame: graphFrame(input, false, [current], output, `Queue: ${queue.join(" → ")}`, [...output], [edge], treeEdges.filter((id) => id !== edge), [next]) }); } }
    steps.push({ id: "bfs-complete", operation: "traversal-complete", explanation: "The queue is empty. Every vertex reachable from the start was visited level by level.", codeLine: 5, frame: graphFrame(input, false, [], output, "BFS complete", output, [], treeEdges) }); return steps;
  },
};

export const dfsLesson: LessonDefinition<GraphInput> = {
  id: "dfs", title: "Depth-first search", category: "algorithm",
  code: ["def dfs(graph, vertex, seen):", "    seen.add(vertex)", "    visit(vertex)", "    for neighbor in graph[vertex]:", "        if neighbor not in seen:", "            dfs(graph, neighbor, seen)"],
  validate: (input) => validateGraph(input),
  createSteps: (input) => {
    const neighbors = adjacency(input); const seen = new Set<string>(); const output: string[] = []; const path: string[] = []; const treeEdges: string[] = []; const steps: VisualizationStep[] = []; let sequence = 0;
    const walk = (current: string, incoming?: string) => { seen.add(current); output.push(current); path.push(current); if (incoming) treeEdges.push(incoming); steps.push({ id: `dfs-${sequence++}`, operation: "visit-and-descend", explanation: `Visit ${current}. The call stack now holds ${path.join(" → ")}.`, codeLine: 2, frame: graphFrame(input, false, [current], output.slice(0, -1), `Call stack: ${path.join(" → ")}`, [...output], incoming ? [incoming] : [], treeEdges.filter((id) => id !== incoming)) }); for (const next of neighbors.get(current)!) if (!seen.has(next)) walk(next, edgeBetween(input, current, next)); path.pop(); steps.push({ id: `dfs-${sequence++}`, operation: "backtrack", explanation: path.length ? `${current} has no unvisited neighbor left. Return to ${path.at(-1)}.` : `${current} is finished. The original call can return.`, codeLine: 5, frame: graphFrame(input, false, path.length ? [path.at(-1)!] : [], [...output], `Backtrack · stack: ${path.join(" → ") || "empty"}`, [...output], [], treeEdges) }); };
    walk(input.start); steps.push({ id: "dfs-complete", operation: "traversal-complete", explanation: "The call stack is empty. DFS explored each branch deeply before trying the next one.", codeLine: 5, frame: graphFrame(input, false, [], output, "DFS complete", output, [], treeEdges) }); return steps;
  },
};

export const componentsLesson: LessonDefinition<GraphInput> = {
  id: "components", title: "Connected components", category: "algorithm",
  code: ["def connected_components(graph):", "    seen = set()", "    components = []", "    for vertex in graph:", "        if vertex not in seen:", "            group = dfs_collect(graph, vertex, seen)", "            components.append(group)", "    return components"],
  validate: (input) => validateGraph(input),
  createSteps: (input) => {
    const neighbors = adjacency(input); const seen = new Set<string>(); const assignments: Record<string, string> = {}; const steps: VisualizationStep[] = []; let component = 0; let sequence = 0;
    for (const start of input.nodes) { if (seen.has(start)) continue; component += 1; const queue = [start]; seen.add(start); assignments[start] = `C${component}`; steps.push({ id: `components-${sequence++}`, operation: "start-component", explanation: `${start} is still unseen, so it starts component ${component}.`, codeLine: 4, frame: graphFrame(input, false, [start], [...seen].filter((node) => node !== start), `Begin component ${component}`, [`C${component}: ${start}`], [], [], [start], [], Object.fromEntries(Object.entries(assignments).map(([node, group]) => [node, `COMPONENT ${group.replace("C", "")}`]))) }); while (queue.length) { const current = queue.shift()!; for (const next of neighbors.get(current)!) if (!seen.has(next)) { seen.add(next); queue.push(next); assignments[next] = `C${component}`; const edge = edgeBetween(input, current, next); steps.push({ id: `components-${sequence++}`, operation: "collect-component", explanation: `${next} connects to component ${component} through ${current}.`, codeLine: 5, frame: graphFrame(input, false, [current], [...seen], `Component ${component}: ${[...seen].filter((node) => assignments[node] === `C${component}`).join(", ")}`, Object.entries(assignments).map(([node, group]) => `${node}:${group}`), [edge], [], [next], [], Object.fromEntries(Object.entries(assignments).map(([node, group]) => [node, `COMPONENT ${group.replace("C", "")}`]))) }); } } }
    const labels = Object.fromEntries(Object.entries(assignments).map(([node, group]) => [node, `COMPONENT ${String(group).replace("C", "")}`]));
    steps.push({ id: "components-complete", operation: "components-complete", explanation: `No unseen vertex remains. This graph contains ${component} connected component${component === 1 ? "" : "s"}.`, codeLine: 7, frame: graphFrame(input, false, [], input.nodes, `${component} connected component${component === 1 ? "" : "s"}`, Object.entries(assignments).map(([node, group]) => `${node}:${group}`), [], input.edges.map((_, index) => edgeId(index)), [], [], labels) }); return steps;
  },
};

function topologicalOrder(input: GraphInput) {
  const lists = adjacency(input, true); const indegree = new Map(input.nodes.map((node) => [node, 0])); for (const edge of input.edges) indegree.set(edge.to, indegree.get(edge.to)! + 1); const queue = input.nodes.filter((node) => indegree.get(node) === 0); const order: string[] = [];
  while (queue.length) { const current = queue.shift()!; order.push(current); for (const next of lists.get(current)!) { indegree.set(next, indegree.get(next)! - 1); if (indegree.get(next) === 0) queue.push(next); } } return order.length === input.nodes.length ? order : null;
}

export const topologicalSortLesson: LessonDefinition<GraphInput> = {
  id: "topological-sort", title: "Topological sort", category: "algorithm",
  code: ["def topological_sort(graph):", "    indegree = count_incoming_edges(graph)", "    queue = deque(vertices_with_indegree_zero)", "    order = []", "    while queue:", "        vertex = queue.popleft()", "        order.append(vertex)", "        for neighbor in graph[vertex]:", "            indegree[neighbor] -= 1", "            if indegree[neighbor] == 0:", "                queue.append(neighbor)", "    return order"],
  validate: (input) => validateGraph(input, true),
  createSteps: (input) => {
    const lists = adjacency(input, true); const indegree = new Map(input.nodes.map((node) => [node, 0])); for (const edge of input.edges) indegree.set(edge.to, indegree.get(edge.to)! + 1); const labels = () => Object.fromEntries(input.nodes.map((node) => [node, `INCOMING ${indegree.get(node)}`])); const queue = input.nodes.filter((node) => indegree.get(node) === 0); const output: string[] = []; const removed: string[] = []; const steps: VisualizationStep[] = [{ id: "topo-0", operation: "count-indegree", explanation: "Count incoming arrows. Only vertices with zero prerequisites can enter the queue.", codeLine: 1, frame: graphFrame(input, true, queue, [], `Ready queue: ${queue.join(" → ")}`, [], [], [], [], [], labels()) }]; let sequence = 1;
    while (queue.length) { const current = queue.shift()!; output.push(current); steps.push({ id: `topo-${sequence++}`, operation: "schedule-vertex", explanation: `${current} has no unmet prerequisite. Append it to the ordering.`, codeLine: 6, frame: graphFrame(input, true, [current], output.slice(0, -1), `Ready queue: ${queue.join(" → ") || "empty"}`, [...output], [], [], [], removed, labels()) }); for (const next of lists.get(current)!) { const edge = edgeBetween(input, current, next, true); removed.push(edge); indegree.set(next, indegree.get(next)! - 1); const ready = indegree.get(next) === 0; if (ready) queue.push(next); steps.push({ id: `topo-${sequence++}`, operation: "remove-dependency", explanation: `Remove ${current} → ${next}. ${next} now has ${indegree.get(next)} incoming edge${indegree.get(next) === 1 ? "" : "s"}${ready ? " and joins the ready queue" : ""}.`, codeLine: ready ? 10 : 8, frame: graphFrame(input, true, [next], output, `Ready queue: ${queue.join(" → ") || "empty"}`, [...output], [edge], [], ready ? [next] : [], removed.filter((id) => id !== edge), labels()) }); } }
    steps.push({ id: "topo-complete", operation: "ordering-complete", explanation: "Every directed edge points from an earlier vertex to a later one in this valid topological order.", codeLine: 11, frame: graphFrame(input, true, [], output, "Topological ordering complete", output, [], [], [], removed, labels()) }); return steps;
  },
};

const usage = (summary: string, examples: string[], chooseWhen: string, avoidWhen: string, operations: [string, string][], practice: string): UsageGuide => ({ summary, examples, chooseWhen, avoidWhen, operations: operations.map(([name, cost]) => ({ name, cost })), practice });

export const graphMeta: Record<GraphLessonId, GraphMeta> = {
  "graph-basics": { id: "graph-basics", navLabel: "Graph Basics", shortLabel: "G", title: "Graphs & Vocabulary", description: "Learn vertices, edges, neighbors, degree, and paths without assuming a root or hierarchy.", concept: "A graph models objects and the connections between them.", rule: "vertices + edges", analogy: "cities joined by roads", usage: usage("Graphs express relationships that may branch, reconnect, and form cycles.", ["Social networks", "Road maps", "Computer networks"], "Relationships are the central part of the problem.", "The data is naturally linear or strictly hierarchical.", [["Store", "O(V+E)*"], ["Traverse", "O(V+E)"], ["Edge check", "varies"]], "Mark a path, a cycle, and each vertex's degree.") },
  "adjacency-list": { id: "adjacency-list", navLabel: "Adjacency List", shortLabel: "{ }", title: "Adjacency List", description: "Store a compact neighbor list beside every vertex.", concept: "Each vertex directly names only the vertices it touches.", rule: "space O(V + E)", analogy: "a contact list for every person", usage: usage("Adjacency lists are the default representation for most sparse real-world graphs.", ["Web links", "Transit connections", "Dependency maps"], "Most possible vertex pairs are not connected.", "Constant-time arbitrary edge lookup matters more than memory.", [["Space", "O(V+E)"], ["Neighbors", "O(deg(v))"], ["Add edge", "O(1)*"]], "Convert an undirected edge list into two-sided neighbor rows.") },
  "adjacency-matrix": { id: "adjacency-matrix", navLabel: "Adjacency Matrix", shortLabel: "▦", title: "Adjacency Matrix", description: "Represent every possible vertex pair with a grid cell containing 0 or 1.", concept: "Row u, column v answers whether u connects to v.", rule: "edge lookup O(1)", analogy: "a yes-or-no seating chart", usage: usage("Adjacency matrices offer simple, constant-time connection checks for dense or small graphs.", ["Dense networks", "Graph algebra", "Small fixed graphs"], "Many pairs connect or direct edge checks dominate.", "The graph is large and sparse; most cells would be zero.", [["Space", "O(V²)"], ["Edge check", "O(1)"], ["Neighbors", "O(V)"]], "Explain why an undirected matrix mirrors across its diagonal.") },
  bfs: { id: "bfs", navLabel: "Breadth-first BFS", shortLabel: "BFS", title: "Breadth-first Search", description: "Use a queue to expand outward one distance layer at a time.", concept: "Discover every nearby vertex before moving farther away.", rule: "queue · shortest unweighted path", analogy: "ripples spreading across water", usage: usage("BFS finds minimum-edge paths and explores graphs in increasing distance from a start.", ["Friend-of-friend distance", "Maze shortest paths", "Network broadcasts"], "Edges have equal cost and the nearest solution matters.", "You need deep exploration or weighted shortest paths.", [["Time", "O(V+E)"], ["Space", "O(V)"], ["Queue", "FIFO"]], "Store parent pointers and reconstruct one shortest path.") },
  dfs: { id: "dfs", navLabel: "Depth-first DFS", shortLabel: "DFS", title: "Depth-first Search", description: "Follow one branch deeply, then backtrack to the latest unfinished choice.", concept: "The call stack remembers where exploration can resume.", rule: "stack · explore deeply", analogy: "exploring a maze with a trail of breadcrumbs", usage: usage("DFS exposes deep structure and is a building block for cycles, components, and ordering.", ["Maze exploration", "Cycle detection", "Dependency analysis"], "You need to fully explore branches or reason about graph structure.", "You specifically need the shortest unweighted path.", [["Time", "O(V+E)"], ["Space", "O(V)"], ["Stack", "LIFO"]], "Classify DFS edges as tree edges or already-seen edges.") },
  components: { id: "components", navLabel: "Components", shortLabel: "C", title: "Connected Components", description: "Restart traversal from every still-unseen vertex to separate disconnected groups.", concept: "One traversal collects exactly one connected region.", rule: "restart from unseen vertices", analogy: "finding separate islands", usage: usage("Components reveal independent groups in an undirected graph.", ["Social communities", "Network outages", "Image regions"], "You need to know which vertices can reach one another.", "Direction or edge weights define the grouping semantics.", [["Time", "O(V+E)"], ["Space", "O(V)"], ["Traversals", "components"]], "Count an isolated vertex as its own component.") },
  "topological-sort": { id: "topological-sort", navLabel: "Topological Sort", shortLabel: "DAG", title: "Topological Sort", description: "Repeatedly schedule a directed vertex whose prerequisites are already satisfied.", concept: "Incoming-edge counts reveal which task is ready next.", rule: "directed acyclic graphs only", analogy: "planning courses from prerequisites", usage: usage("Topological order turns dependency constraints into a valid linear schedule.", ["Course prerequisites", "Build systems", "Workflow scheduling"], "Dependencies are directed and contain no cycle.", "The graph is undirected or cyclic; no valid complete order exists.", [["Time", "O(V+E)"], ["Space", "O(V)"], ["Cycle check", "included"]], "Add an edge that creates a cycle and explain why the queue empties early.") },
};
