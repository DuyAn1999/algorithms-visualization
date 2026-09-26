"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  advancedTreeMeta,
  avlBalanceLesson,
  bstDeleteLesson,
  bstInsertLesson,
  bstRuleLesson,
  bstSearchLesson,
  heapExtractLesson,
  heapInsertLesson,
  type AdvancedTreeLessonId,
  type RotationKind,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type { VisualizationStep, VisualItem } from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";
import { CourseMenu } from "./course-menu";
import { usePlaybackShortcuts } from "./use-playback-shortcuts";
import { ProgressBadge } from "./progress-badge";
import { parseCompletedLessons, readLocalValue, writeLocalValue } from "@/lib/local-progress.ts";

const lessonOrder: AdvancedTreeLessonId[] = ["bst-rule", "bst-search", "bst-insert", "bst-delete", "heap-insert", "heap-extract", "avl-balance"];
const definitions = { "bst-rule": bstRuleLesson, "bst-search": bstSearchLesson, "bst-insert": bstInsertLesson, "bst-delete": bstDeleteLesson, "heap-insert": heapInsertLesson, "heap-extract": heapExtractLesson, "avl-balance": avlBalanceLesson } as const;
const bstDefault = [50, 30, 70, 20, 40, 60, 80];
const defaults: Record<AdvancedTreeLessonId, { values: number[]; value: number }> = {
  "bst-rule": { values: bstDefault, value: 60 }, "bst-search": { values: bstDefault, value: 60 }, "bst-insert": { values: bstDefault, value: 65 }, "bst-delete": { values: bstDefault, value: 30 },
  "heap-insert": { values: [10, 20, 15, 30, 40, 50], value: 5 }, "heap-extract": { values: [10, 20, 15, 30, 40, 50, 25], value: 0 }, "avl-balance": { values: [], value: 0 },
};

function TreeBranch({ item, items }: { item: VisualItem; items: readonly VisualItem[] }) {
  const children = items.filter((candidate) => candidate.parentId === item.id);
  return <div className="tree-branch">{item.edgeLabel && <span className="tree-edge-label">{item.edgeLabel}</span>}<div className={`tree-node state-${item.state}`}><small>{item.label}</small><strong>{item.value}</strong></div>{children.length > 0 && <div className={`tree-children children-${children.length}`}>{children.map((child) => <TreeBranch item={child} items={items} key={child.id} />)}</div>}</div>;
}

function AdvancedTreeStage({ step, lessonId }: { step: VisualizationStep; lessonId: AdvancedTreeLessonId }) {
  const roots = step.frame.items.filter((item) => item.parentId == null);
  const traceLabel = lessonId.startsWith("heap") ? "HEAP ARRAY · INDEX ORDER" : lessonId === "avl-balance" ? "BALANCE TRACE" : "DECISION PATH / INORDER CHECK";
  return <div className="tree-stage advanced-tree-stage"><div className="structure-caption">{step.frame.caption}</div><div className="tree-canvas advanced-tree-canvas">{roots.map((root) => <TreeBranch item={root} items={step.frame.items} key={root.id} />)}</div><div className="traversal-output"><small>{traceLabel}</small><div>{step.frame.output?.length ? step.frame.output.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <em>The current path or structural check will appear here</em>}</div></div><div className="visual-legend"><span><i className="legend-active" />current decision</span><span><i className="legend-completed" />valid / settled</span><span><i className="legend-idle" />unchanged</span></div></div>;
}

function UsageSection({ lessonId }: { lessonId: AdvancedTreeLessonId }) {
  const usage = advancedTreeMeta[lessonId].usage;
  return <section className="usage-section" aria-label={`${advancedTreeMeta[lessonId].title} usage guide`}><div className="usage-heading"><span>USE IT WITH CONFIDENCE</span><h2>Where this tree operation is useful</h2><p>{usage.summary}</p></div><div className="usage-grid"><div className="usage-card choose-card"><span className="usage-icon">✓</span><div><small>Choose it when</small><p>{usage.chooseWhen}</p></div></div><div className="usage-card avoid-card"><span className="usage-icon">!</span><div><small>Think twice when</small><p>{usage.avoidWhen}</p></div></div><div className="usage-card examples-card"><small>Real examples</small><ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul></div><div className="usage-card complexity-card"><small>Cost guide</small><div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div></div></div><div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button type="button" onClick={() => document.querySelector(".lesson-toolbar")?.scrollIntoView({ behavior: "smooth" })}>Try another case ↑</button></div></section>;
}

function isMinHeap(values: number[]) { return values.every((value, index) => index === 0 || values[Math.floor((index - 1) / 2)] <= value); }
function heapify(values: number[]) { const heap: number[] = []; for (const value of values) { heap.push(value); let child = heap.length - 1; while (child > 0) { const parent = Math.floor((child - 1) / 2); if (heap[parent] <= heap[child]) break; [heap[parent], heap[child]] = [heap[child], heap[parent]]; child = parent; } } return heap; }

export function SearchTreesLab() {
  const [lessonId, setLessonId] = useState<AdvancedTreeLessonId>("bst-rule");
  const [values, setValues] = useState(bstDefault);
  const [draft, setDraft] = useState(bstDefault.join(", "));
  const [operationValue, setOperationValue] = useState(60);
  const [operationDraft, setOperationDraft] = useState("60");
  const [rotation, setRotation] = useState<RotationKind>("ll");
  const [inputError, setInputError] = useState("");
  const [completed, setCompleted] = useState<AdvancedTreeLessonId[]>([]);
  const isHeap = lessonId === "heap-insert" || lessonId === "heap-extract";
  const hasNumericOperation = lessonId === "bst-search" || lessonId === "bst-insert" || lessonId === "heap-insert";

  const demo = useMemo(() => {
    const input = { values, value: operationValue, rotation };
    if (lessonId === "bst-rule") return createTimeline(bstRuleLesson, input);
    if (lessonId === "bst-search") return createTimeline(bstSearchLesson, input);
    if (lessonId === "bst-insert") return createTimeline(bstInsertLesson, input);
    if (lessonId === "bst-delete") return createTimeline(bstDeleteLesson, input);
    if (lessonId === "heap-insert") return createTimeline(heapInsertLesson, input);
    if (lessonId === "heap-extract") return createTimeline(heapExtractLesson, input);
    return createTimeline(avlBalanceLesson, input);
  }, [lessonId, operationValue, rotation, values]);

  const player = useVisualizationPlayer(demo); const meta = advancedTreeMeta[lessonId]; const step = player.currentStep; const definition = definitions[lessonId];

  useEffect(() => {
    const restored = parseCompletedLessons(readLocalValue("algolab-advanced-tree-progress"), lessonOrder);
    queueMicrotask(() => setCompleted(restored));
  }, []);

  useEffect(() => {
    if (player.state.status !== "completed") return;
    // Parse before scheduling: malformed stored data must never escape a microtask.
    queueMicrotask(() => setCompleted((previous) => {
      if (previous.includes(lessonId)) return previous;
      const next = [...new Set([...parseCompletedLessons(readLocalValue("algolab-advanced-tree-progress"), lessonOrder), ...previous, lessonId])];
      writeLocalValue("algolab-advanced-tree-progress", JSON.stringify(next));
      return next;
    }));
  }, [lessonId, player.state.status]);

  usePlaybackShortcuts(player);

  const selectLesson = (next: AdvancedTreeLessonId) => { player.reset(); const preset = defaults[next]; setLessonId(next); setValues(preset.values); setDraft(preset.values.join(", ")); setOperationValue(preset.value); setOperationDraft(String(preset.value)); setRotation("ll"); setInputError(""); };

  const applyInput = () => {
    if (lessonId === "avl-balance") { player.reset(); setInputError(""); return; }
    const parsed = draft.split(",").map((part) => Number(part.trim()));
    if (parsed.length < 3 || parsed.length > 9 || parsed.some((value) => !Number.isInteger(value))) { setInputError("Enter 3–9 whole numbers separated by commas."); return; }
    if (new Set(parsed).size !== parsed.length) { setInputError("Use distinct tree values so each node is easy to identify."); return; }
    if (isHeap && !isMinHeap(parsed)) { setInputError("For heap operations, every parent must be no larger than its children."); return; }
    let nextOperation = operationValue;
    if (hasNumericOperation) { nextOperation = Number(operationDraft); if (!Number.isInteger(nextOperation)) { setInputError("The operation value must be a whole number."); return; } }
    if (lessonId === "bst-insert" && parsed.includes(nextOperation)) { setInputError("Choose a new key that is not already in the BST."); return; }
    if (lessonId === "bst-delete" && !parsed.includes(nextOperation)) nextOperation = parsed[Math.min(1, parsed.length - 1)];
    player.reset(); setValues(parsed); setDraft(parsed.join(", ")); setOperationValue(nextOperation); setOperationDraft(String(nextOperation)); setInputError("");
  };

  const randomize = () => {
    if (lessonId === "avl-balance") return;
    const pool = Array.from({ length: 90 }, (_, index) => index + 10);
    for (let index = pool.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [pool[index], pool[swap]] = [pool[swap], pool[index]]; }
    const raw = pool.slice(0, values.length); const next = isHeap ? heapify(raw) : raw; let nextOperation = operationValue;
    if (lessonId === "bst-delete") nextOperation = next[1];
    if (lessonId === "bst-insert") nextOperation = Math.max(...next) + 1;
    player.reset(); setValues(next); setDraft(next.join(", ")); setOperationValue(nextOperation); setOperationDraft(String(nextOperation)); setInputError("");
  };

  const nextLesson = () => selectLesson(lessonOrder[(lessonOrder.indexOf(lessonId) + 1) % lessonOrder.length]);

  const operationControl = () => {
    if (lessonId === "bst-delete") return <label>Delete key<select value={operationValue} onChange={(event) => { player.reset(); setOperationValue(Number(event.target.value)); setOperationDraft(event.target.value); }}>{values.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>;
    if (lessonId === "avl-balance") return <label>Imbalance case<select value={rotation} onChange={(event) => { player.reset(); setRotation(event.target.value as RotationKind); }}><option value="ll">LL · right rotation</option><option value="rr">RR · left rotation</option><option value="lr">LR · double rotation</option><option value="rl">RL · double rotation</option></select></label>;
    if (!hasNumericOperation) return null;
    const label = lessonId === "bst-search" ? "Search key" : lessonId === "bst-insert" ? "New key" : "New priority";
    return <label>{label}<input className="operation-value-input" type="text" value={operationDraft} onChange={(event) => setOperationDraft(event.target.value)} /></label>;
  };

  return <main className="app-shell"><aside className="sidebar linear-sidebar tree-sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div><div className="checkpoint-progress"><div><span>Search trees</span><strong>{completed.length} / 7</strong></div><div className="progress-track"><span style={{ width: `${completed.length * (100 / 7)}%` }} /></div></div><nav aria-label="Search tree and heap lessons"><p>Previous checkpoint</p><Link className="nav-section-link" href="/tree-foundations"><span>✓</span><b>Tree foundations</b></Link><p>Search & priority trees</p>{lessonOrder.map((id, index) => <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}><span>{advancedTreeMeta[id].shortLabel}</span><b>{advancedTreeMeta[id].navLabel}</b><i>{completed.includes(id) ? "✓" : String(index + 1).padStart(2, "0")}</i></button>)}<p>Coming next</p><Link className="nav-section-link" href="/graph-foundations"><span>08</span><b>Graph foundations</b></Link></nav><div className="sidebar-tip"><span>✦</span><p><strong>Watch the shape</strong><small>Search follows ordering. Heaps preserve completeness. AVL rotations preserve both order and height.</small></p></div></aside>
    <section className="workspace"><header className="topbar"><div><span>Checkpoint 7</span><b>/</b><strong>Search & priority trees</strong></div><div className="topbar-actions"><CourseMenu currentPath="/search-trees" /><ProgressBadge /></div></header><div className="page-content linear-content"><label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as AdvancedTreeLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{advancedTreeMeta[id].navLabel}</option>)}</select></label>
      <section className="page-heading foundation-heading"><div><span className="eyebrow">TREE OPERATION {lessonOrder.indexOf(lessonId) + 1} OF 7 · TRACE EVERY DECISION</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div></section><section className="concept-strip"><div className="analogy-mark">{meta.shortLabel}</div><div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div><span>{meta.rule}</span></section>
      <section className="lesson-toolbar tree-toolbar advanced-tree-toolbar"><div className="tree-inputs">{lessonId !== "avl-balance" && <label>{isHeap ? "Heap array" : "BST insertion order"}<input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyInput()} aria-invalid={Boolean(inputError)} /></label>}{operationControl()}<button type="button" onClick={applyInput}>Apply</button>{lessonId !== "avl-balance" && <button type="button" className="secondary-action" onClick={randomize}>New values</button>}</div><div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div><div className="input-feedback"><span>{isHeap ? "Array order maps directly onto the complete tree." : lessonId === "avl-balance" ? "Switch cases to compare single and double rotations." : "Values are inserted from left to right to build the BST."}</span>{inputError && <strong role="alert">{inputError}</strong>}</div></section>
      <section className="learning-grid foundation-learning-grid"><article className="visual-card"><div className="card-header"><div><span className="live-dot" /><strong>Tree operation playground</strong></div><span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.steps.length}</span></div><div className="visual-stage tree-visual-stage advanced-tree-visual-stage"><AdvancedTreeStage step={step} lessonId={lessonId} /></div><div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div><div className="playback-controls"><button onClick={player.reset} aria-label="Reset visualization">↺</button><button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button><button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>{player.state.status === "playing" ? "Ⅱ" : "▶"}</button><button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button><label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label></div><div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.steps.length) * 100)}%` }} /></div></article>
        <aside className="code-card foundation-code-card"><div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div><div className="code-lines">{definition.code.map((line, index) => <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div><div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div></aside></section>
      <UsageSection lessonId={lessonId} /><section className="next-lesson-strip"><div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div><button onClick={nextLesson}>Next tree operation <span>→</span></button></section></div></section></main>;
}
