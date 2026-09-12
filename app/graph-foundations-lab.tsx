"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adjacencyListLesson,
  adjacencyMatrixLesson,
  bfsLesson,
  componentsLesson,
  dfsLesson,
  graphBasicsLesson,
  graphMeta,
  topologicalSortLesson,
  type GraphEdgeInput,
  type GraphLessonId,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type { VisualizationStep, VisualEdge } from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";

const lessonOrder: GraphLessonId[] = ["graph-basics", "adjacency-list", "adjacency-matrix", "bfs", "dfs", "components", "topological-sort"];
const definitions = { "graph-basics": graphBasicsLesson, "adjacency-list": adjacencyListLesson, "adjacency-matrix": adjacencyMatrixLesson, bfs: bfsLesson, dfs: dfsLesson, components: componentsLesson, "topological-sort": topologicalSortLesson } as const;
const commonNodes = ["A", "B", "C", "D", "E", "F"];
const commonEdges: GraphEdgeInput[] = [{ from: "A", to: "B" }, { from: "A", to: "C" }, { from: "B", to: "D" }, { from: "B", to: "E" }, { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" }];
const componentEdges: GraphEdgeInput[] = [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "D", to: "E" }];
const dagEdges: GraphEdgeInput[] = [{ from: "A", to: "C" }, { from: "B", to: "C" }, { from: "B", to: "D" }, { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" }];
const positions = [{ x: 50, y: 12 }, { x: 21, y: 35 }, { x: 79, y: 35 }, { x: 14, y: 76 }, { x: 50, y: 68 }, { x: 86, y: 76 }, { x: 50, y: 91 }];

function edgeStyle(edge: VisualEdge, step: VisualizationStep) {
  const fromIndex = step.frame.items.findIndex((item) => item.id === edge.from); const toIndex = step.frame.items.findIndex((item) => item.id === edge.to);
  const from = positions[fromIndex]; const to = positions[toIndex]; const dx = to.x - from.x; const dy = (to.y - from.y) * (9 / 16); const width = Math.sqrt(dx * dx + dy * dy); const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return { left: `${from.x}%`, top: `${from.y}%`, width: `${width}%`, transform: `rotate(${angle}deg)` };
}

function GraphCanvas({ step }: { step: VisualizationStep }) {
  return <div className="graph-canvas">{step.frame.edges?.map((edge) => <div className={`graph-edge state-${edge.state} ${edge.directed ? "directed" : ""}`} style={edgeStyle(edge, step)} key={edge.id}><span>{edge.label}</span></div>)}{step.frame.items.map((item, index) => <div className={`graph-node state-${item.state}`} style={{ left: `${positions[index].x}%`, top: `${positions[index].y}%` }} key={item.id}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div>;
}

function AdjacencyListStage({ step }: { step: VisualizationStep }) {
  return <div className="graph-list-stage"><div className="structure-caption">{step.frame.caption}</div><div className="graph-list-rows">{step.frame.items.map((item) => <div className={`graph-list-row state-${item.state}`} key={item.id}><span>{item.label?.replace("vertex ", "")}</span><i>→</i><strong>{item.value}</strong></div>)}</div><div className="stage-help">Each row stores only neighbors reached by a real edge.</div></div>;
}

function GraphMatrixStage({ step }: { step: VisualizationStep }) {
  return <div className="graph-matrix-stage"><div className="structure-caption">{step.frame.caption}</div><div className="graph-matrix" style={{ gridTemplateColumns: `repeat(${step.frame.columns ?? 3}, minmax(38px, 1fr))` }}>{step.frame.items.map((item) => <div className={`graph-matrix-cell state-${item.state}`} key={item.id}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div><div className="stage-help">1 means connected · 0 means no edge</div></div>;
}

function GraphStage({ step }: { step: VisualizationStep }) {
  if (step.frame.layout === "adjacency-list") return <AdjacencyListStage step={step} />;
  if (step.frame.layout === "matrix") return <GraphMatrixStage step={step} />;
  return <div className="graph-stage"><div className="structure-caption">{step.frame.caption}</div><GraphCanvas step={step} /><div className="traversal-output graph-output"><small>ALGORITHM TRACE</small><div>{step.frame.output?.length ? step.frame.output.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <em>Visited vertices, queue results, or groups appear here</em>}</div></div><div className="visual-legend"><span><i className="legend-active" />current vertex / edge</span><span><i className="legend-completed" />visited / selected</span><span><i className="legend-idle" />unseen</span></div></div>;
}

function UsageSection({ lessonId }: { lessonId: GraphLessonId }) {
  const usage = graphMeta[lessonId].usage;
  return <section className="usage-section" aria-label={`${graphMeta[lessonId].title} usage guide`}><div className="usage-heading"><span>USE IT WITH CONFIDENCE</span><h2>Where this graph idea is useful</h2><p>{usage.summary}</p></div><div className="usage-grid"><div className="usage-card choose-card"><span className="usage-icon">✓</span><div><small>Choose it when</small><p>{usage.chooseWhen}</p></div></div><div className="usage-card avoid-card"><span className="usage-icon">!</span><div><small>Think twice when</small><p>{usage.avoidWhen}</p></div></div><div className="usage-card examples-card"><small>Real examples</small><ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul></div><div className="usage-card complexity-card"><small>Cost guide</small><div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div></div></div><div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button type="button" onClick={() => document.querySelector(".lesson-toolbar")?.scrollIntoView({ behavior: "smooth" })}>Edit the graph ↑</button></div></section>;
}

function presetFor(lessonId: GraphLessonId) { return { nodes: [...commonNodes], edges: lessonId === "components" ? componentEdges.map((edge) => ({ ...edge })) : lessonId === "topological-sort" ? dagEdges.map((edge) => ({ ...edge })) : commonEdges.map((edge) => ({ ...edge })), start: "A" }; }
function edgeText(edges: GraphEdgeInput[]) { return edges.map((edge) => `${edge.from}-${edge.to}`).join(", "); }

export function GraphFoundationsLab() {
  const initial = presetFor("graph-basics");
  const [lessonId, setLessonId] = useState<GraphLessonId>("graph-basics"); const [nodes, setNodes] = useState(initial.nodes); const [edges, setEdges] = useState(initial.edges); const [start, setStart] = useState(initial.start);
  const [nodesDraft, setNodesDraft] = useState(initial.nodes.join(", ")); const [edgesDraft, setEdgesDraft] = useState(edgeText(initial.edges)); const [inputError, setInputError] = useState(""); const [completed, setCompleted] = useState<GraphLessonId[]>([]);
  const needsStart = ["graph-basics", "bfs", "dfs"].includes(lessonId);
  const directed = lessonId === "topological-sort";

  const demo = useMemo(() => { const input = { nodes, edges, start }; if (lessonId === "graph-basics") return createTimeline(graphBasicsLesson, input); if (lessonId === "adjacency-list") return createTimeline(adjacencyListLesson, input); if (lessonId === "adjacency-matrix") return createTimeline(adjacencyMatrixLesson, input); if (lessonId === "bfs") return createTimeline(bfsLesson, input); if (lessonId === "dfs") return createTimeline(dfsLesson, input); if (lessonId === "components") return createTimeline(componentsLesson, input); return createTimeline(topologicalSortLesson, input); }, [edges, lessonId, nodes, start]);
  const player = useVisualizationPlayer(demo); const meta = graphMeta[lessonId]; const step = player.currentStep; const definition = definitions[lessonId];

  useEffect(() => { const stored = window.localStorage.getItem("algolab-graph-progress"); if (!stored) return; try { const parsed = JSON.parse(stored) as GraphLessonId[]; queueMicrotask(() => setCompleted(parsed.filter((id) => lessonOrder.includes(id)))); } catch { window.localStorage.removeItem("algolab-graph-progress"); } }, []);
  useEffect(() => { if (player.state.status !== "completed") return; queueMicrotask(() => setCompleted((previous) => { if (previous.includes(lessonId)) return previous; const next = [...previous, lessonId]; window.localStorage.setItem("algolab-graph-progress", JSON.stringify(next)); return next; })); }, [lessonId, player.state.status]);
  useEffect(() => { const handleKeyboard = (event: KeyboardEvent) => { const element = event.target as HTMLElement | null; if (["INPUT", "BUTTON", "SELECT"].includes(element?.tagName ?? "")) return; if (event.code === "Space") { event.preventDefault(); if (player.state.status === "playing") player.pause(); else player.play(); } if (event.key === "ArrowRight") player.next(); if (event.key === "ArrowLeft") player.previous(); if (event.key.toLowerCase() === "r") player.reset(); }; window.addEventListener("keydown", handleKeyboard); return () => window.removeEventListener("keydown", handleKeyboard); }, [player]);

  const selectLesson = (next: GraphLessonId) => { player.reset(); const preset = presetFor(next); setLessonId(next); setNodes(preset.nodes); setEdges(preset.edges); setStart(preset.start); setNodesDraft(preset.nodes.join(", ")); setEdgesDraft(edgeText(preset.edges)); setInputError(""); };
  const applyInput = () => {
    const parsedNodes = nodesDraft.split(",").map((node) => node.trim().toUpperCase()).filter(Boolean);
    const parsedEdges: GraphEdgeInput[] = []; for (const raw of edgesDraft.split(",").map((edge) => edge.trim()).filter(Boolean)) { const parts = raw.toUpperCase().split(/[-→>]/).map((part) => part.trim()); if (parts.length !== 2 || !parts[0] || !parts[1]) { setInputError("Write edges like A-B, A-C, B-D."); return; } parsedEdges.push({ from: parts[0], to: parts[1] }); }
    const nextStart = parsedNodes.includes(start) ? start : parsedNodes[0]; const validation = definition.validate({ nodes: parsedNodes, edges: parsedEdges, start: nextStart });
    if (!validation.valid) { setInputError(validation.message); return; }
    player.reset(); setNodes(parsedNodes); setEdges(parsedEdges); setStart(nextStart); setNodesDraft(parsedNodes.join(", ")); setEdgesDraft(edgeText(parsedEdges)); setInputError("");
  };
  const resetExample = () => { const preset = presetFor(lessonId); player.reset(); setNodes(preset.nodes); setEdges(preset.edges); setStart(preset.start); setNodesDraft(preset.nodes.join(", ")); setEdgesDraft(edgeText(preset.edges)); setInputError(""); };
  const nextLesson = () => selectLesson(lessonOrder[(lessonOrder.indexOf(lessonId) + 1) % lessonOrder.length]);

  return <main className="app-shell"><aside className="sidebar linear-sidebar graph-sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div><div className="checkpoint-progress"><div><span>Graph foundations</span><strong>{completed.length} / 7</strong></div><div className="progress-track"><span style={{ width: `${completed.length * (100 / 7)}%` }} /></div></div><nav aria-label="Graph foundation lessons"><p>Previous checkpoint</p><Link className="nav-section-link" href="/search-trees"><span>✓</span><b>Search trees</b></Link><p>Graph foundations</p>{lessonOrder.map((id, index) => <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}><span>{graphMeta[id].shortLabel}</span><b>{graphMeta[id].navLabel}</b><i>{completed.includes(id) ? "✓" : String(index + 1).padStart(2, "0")}</i></button>)}<p>Coming next</p><div className="nav-item locked"><span>09</span><b>Weighted graphs</b><i>locked</i></div></nav><div className="sidebar-tip"><span>✦</span><p><strong>Watch vertices and edges</strong><small>Orange shows the connection being followed. Lime records visited or selected structure.</small></p></div></aside>
    <section className="workspace"><header className="topbar"><div><span>Checkpoint 8</span><b>/</b><strong>Graph foundations</strong></div><span className="local-badge"><i />Progress saved locally</span></header><div className="page-content linear-content"><label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as GraphLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{graphMeta[id].navLabel}</option>)}</select></label>
      <section className="page-heading foundation-heading"><div><span className="eyebrow">GRAPH LESSON {lessonOrder.indexOf(lessonId) + 1} OF 7 · FOLLOW THE CONNECTIONS</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div></section><section className="concept-strip"><div className="analogy-mark">{meta.shortLabel}</div><div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div><span>{meta.rule}</span></section>
      <section className="lesson-toolbar graph-toolbar"><div className="graph-inputs"><label>Vertices<input type="text" value={nodesDraft} onChange={(event) => setNodesDraft(event.target.value)} aria-invalid={Boolean(inputError)} /></label><label>{directed ? "Directed edges" : "Undirected edges"}<input type="text" value={edgesDraft} onChange={(event) => setEdgesDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyInput()} aria-invalid={Boolean(inputError)} /></label>{needsStart && <label>Start<select value={start} onChange={(event) => { player.reset(); setStart(event.target.value); }}>{nodes.map((node) => <option value={node} key={node}>{node}</option>)}</select></label>}<button type="button" onClick={applyInput}>Apply</button><button type="button" className="secondary-action" onClick={resetExample}>Reset example</button></div><div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div><div className="input-feedback"><span>{directed ? "A-B means A must come before B; cyclic input is rejected." : "A-B creates a two-way connection. Unlisted vertices remain isolated."}</span>{inputError && <strong role="alert">{inputError}</strong>}</div></section>
      <section className="learning-grid foundation-learning-grid"><article className="visual-card"><div className="card-header"><div><span className="live-dot" /><strong>Graph playground</strong></div><span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.steps.length}</span></div><div className="visual-stage graph-visual-stage"><GraphStage step={step} /></div><div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div><div className="playback-controls"><button onClick={player.reset} aria-label="Reset visualization">↺</button><button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button><button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>{player.state.status === "playing" ? "Ⅱ" : "▶"}</button><button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button><label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label></div><div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.steps.length) * 100)}%` }} /></div></article>
        <aside className="code-card foundation-code-card"><div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div><div className="code-lines">{definition.code.map((line, index) => <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div><div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div></aside></section>
      <UsageSection lessonId={lessonId} /><section className="next-lesson-strip"><div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div><button onClick={nextLesson}>Next graph lesson <span>→</span></button></section></div></section></main>;
}
