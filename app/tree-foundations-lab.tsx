"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  binaryTreeLesson,
  generalTreeLesson,
  inorderLesson,
  levelOrderLesson,
  postorderLesson,
  preorderLesson,
  treeMeta,
  type TreeLessonId,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type { VisualizationStep, VisualItem } from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";

const lessonOrder: TreeLessonId[] = ["general-tree", "binary-tree", "preorder", "inorder", "postorder", "level-order"];
const definitions = { "general-tree": generalTreeLesson, "binary-tree": binaryTreeLesson, preorder: preorderLesson, inorder: inorderLesson, postorder: postorderLesson, "level-order": levelOrderLesson } as const;
const defaultValues = [8, 4, 12, 2, 6, 10, 14];

function TreeBranch({ item, items }: { item: VisualItem; items: readonly VisualItem[] }) {
  const children = items.filter((candidate) => candidate.parentId === item.id);
  return (
    <div className="tree-branch">
      {item.edgeLabel && <span className="tree-edge-label">{item.edgeLabel}</span>}
      <div className={`tree-node state-${item.state}`}><small>{item.label}</small><strong>{item.value}</strong></div>
      {children.length > 0 && <div className={`tree-children children-${children.length}`}>{children.map((child) => <TreeBranch item={child} items={items} key={child.id} />)}</div>}
    </div>
  );
}

function TreeStage({ step }: { step: VisualizationStep }) {
  const roots = step.frame.items.filter((item) => item.parentId == null);
  return (
    <div className="tree-stage">
      <div className="structure-caption">{step.frame.caption}</div>
      <div className="tree-canvas">{roots.map((root) => <TreeBranch item={root} items={step.frame.items} key={root.id} />)}</div>
      <div className="traversal-output"><small>VISIT OUTPUT</small><div>{step.frame.output?.length ? step.frame.output.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <em>Values will appear here as nodes are visited</em>}</div></div>
      <div className="visual-legend"><span><i className="legend-active" />current relationship / node</span><span><i className="legend-completed" />visited</span><span><i className="legend-idle" />waiting</span></div>
    </div>
  );
}

function UsageSection({ lessonId }: { lessonId: TreeLessonId }) {
  const usage = treeMeta[lessonId].usage;
  return (
    <section className="usage-section" aria-label={`${treeMeta[lessonId].title} usage guide`}>
      <div className="usage-heading"><span>USE IT WITH CONFIDENCE</span><h2>Where this tree idea is useful</h2><p>{usage.summary}</p></div>
      <div className="usage-grid">
        <div className="usage-card choose-card"><span className="usage-icon">✓</span><div><small>Choose it when</small><p>{usage.chooseWhen}</p></div></div>
        <div className="usage-card avoid-card"><span className="usage-icon">!</span><div><small>Think twice when</small><p>{usage.avoidWhen}</p></div></div>
        <div className="usage-card examples-card"><small>Real examples</small><ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul></div>
        <div className="usage-card complexity-card"><small>Cost guide</small><div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div></div>
      </div>
      <div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button type="button" onClick={() => document.querySelector(".lesson-toolbar")?.scrollIntoView({ behavior: "smooth" })}>Change the tree ↑</button></div>
    </section>
  );
}

export function TreeFoundationsLab() {
  const [lessonId, setLessonId] = useState<TreeLessonId>("general-tree");
  const [values, setValues] = useState(defaultValues);
  const [draft, setDraft] = useState(defaultValues.join(", "));
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [inputError, setInputError] = useState("");
  const [completed, setCompleted] = useState<TreeLessonId[]>([]);
  const isStructureLesson = lessonId === "general-tree" || lessonId === "binary-tree";

  const demo = useMemo(() => {
    const input = { values, selectedIndex };
    if (lessonId === "general-tree") return createTimeline(generalTreeLesson, input);
    if (lessonId === "binary-tree") return createTimeline(binaryTreeLesson, input);
    if (lessonId === "preorder") return createTimeline(preorderLesson, input);
    if (lessonId === "inorder") return createTimeline(inorderLesson, input);
    if (lessonId === "postorder") return createTimeline(postorderLesson, input);
    return createTimeline(levelOrderLesson, input);
  }, [lessonId, selectedIndex, values]);

  const player = useVisualizationPlayer(demo);
  const meta = treeMeta[lessonId];
  const step = player.currentStep;
  const definition = definitions[lessonId];

  useEffect(() => {
    const stored = window.localStorage.getItem("algolab-tree-progress");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as TreeLessonId[];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompleted(parsed.filter((id) => lessonOrder.includes(id)));
    } catch { window.localStorage.removeItem("algolab-tree-progress"); }
  }, []);

  useEffect(() => {
    if (player.state.status !== "completed") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompleted((previous) => {
      if (previous.includes(lessonId)) return previous;
      const next = [...previous, lessonId];
      window.localStorage.setItem("algolab-tree-progress", JSON.stringify(next));
      return next;
    });
  }, [lessonId, player.state.status]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (["INPUT", "BUTTON", "SELECT"].includes(element?.tagName ?? "")) return;
      if (event.code === "Space") { event.preventDefault(); if (player.state.status === "playing") player.pause(); else player.play(); }
      if (event.key === "ArrowRight") player.next();
      if (event.key === "ArrowLeft") player.previous();
      if (event.key.toLowerCase() === "r") player.reset();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [player]);

  const selectLesson = (next: TreeLessonId) => { player.reset(); setLessonId(next); setInputError(""); };

  const applyDraft = () => {
    const parsed = draft.split(",").map((part) => Number(part.trim()));
    if (parsed.length < 3 || parsed.length > 7 || parsed.some((value) => !Number.isInteger(value))) { setInputError("Enter 3–7 whole numbers separated by commas."); return; }
    player.reset(); setValues(parsed); setDraft(parsed.join(", ")); setSelectedIndex((current) => Math.min(current, parsed.length - 1)); setInputError("");
  };

  const randomize = () => {
    const pool = Array.from({ length: 30 }, (_, index) => index + 1);
    for (let index = pool.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [pool[index], pool[swap]] = [pool[swap], pool[index]]; }
    const next = pool.slice(0, values.length);
    player.reset(); setValues(next); setDraft(next.join(", ")); setInputError("");
  };

  const nextLesson = () => selectLesson(lessonOrder[(lessonOrder.indexOf(lessonId) + 1) % lessonOrder.length]);

  return (
    <main className="app-shell">
      <aside className="sidebar linear-sidebar tree-sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div>
        <div className="checkpoint-progress"><div><span>Tree foundations</span><strong>{completed.length} / 6</strong></div><div className="progress-track"><span style={{ width: `${completed.length * (100 / 6)}%` }} /></div></div>
        <nav aria-label="Tree foundation lessons">
          <p>Previous checkpoint</p><Link className="nav-section-link" href="/sorting-searching"><span>✓</span><b>Search & sort</b></Link>
          <p>Tree foundations</p>
          {lessonOrder.map((id, index) => <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}><span>{treeMeta[id].shortLabel}</span><b>{treeMeta[id].navLabel}</b><i>{completed.includes(id) ? "✓" : String(index + 1).padStart(2, "0")}</i></button>)}
          <p>Coming next</p><Link className="nav-section-link" href="/search-trees"><span>07</span><b>BST, heaps & balance</b></Link>
        </nav>
        <div className="sidebar-tip"><span>✦</span><p><strong>Trace the edges</strong><small>Start at ROOT and follow labeled branches. Orange shows the relationship being explained.</small></p></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span>Checkpoint 6</span><b>/</b><strong>Tree foundations</strong></div><span className="local-badge"><i />Progress saved locally</span></header>
        <div className="page-content linear-content">
          <label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as TreeLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{treeMeta[id].navLabel}</option>)}</select></label>
          <section className="page-heading foundation-heading"><div><span className="eyebrow">TREE LESSON {lessonOrder.indexOf(lessonId) + 1} OF 6 · FOLLOW THE BRANCHES</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div></section>
          <section className="concept-strip"><div className="analogy-mark">{meta.shortLabel}</div><div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div><span>{meta.rule}</span></section>
          <section className="lesson-toolbar tree-toolbar">
            <div className="tree-inputs"><label>Level-order node values<input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyDraft()} aria-invalid={Boolean(inputError)} /></label>{isStructureLesson && <label>Inspect node<select value={selectedIndex} onChange={(event) => { player.reset(); setSelectedIndex(Number(event.target.value)); }}>{values.map((value, index) => <option value={index} key={index}>{value} · index {index}</option>)}</select></label>}<button type="button" onClick={applyDraft}>Apply</button><button type="button" className="secondary-action" onClick={randomize}>New values</button></div>
            <div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div>
            <div className="input-feedback"><span>Values fill the tree one level at a time, from left to right.</span>{inputError && <strong role="alert">{inputError}</strong>}</div>
          </section>

          <section className="learning-grid foundation-learning-grid">
            <article className="visual-card"><div className="card-header"><div><span className="live-dot" /><strong>Tree playground</strong></div><span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.steps.length}</span></div>
              <div className="visual-stage tree-visual-stage"><TreeStage step={step} /></div>
              <div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div>
              <div className="playback-controls"><button onClick={player.reset} aria-label="Reset visualization">↺</button><button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button><button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>{player.state.status === "playing" ? "Ⅱ" : "▶"}</button><button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button><label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label></div>
              <div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.steps.length) * 100)}%` }} /></div>
            </article>
            <aside className="code-card foundation-code-card"><div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div><div className="code-lines">{definition.code.map((line, index) => <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div><div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div></aside>
          </section>
          <UsageSection lessonId={lessonId} />
          <section className="next-lesson-strip"><div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div><button onClick={nextLesson}>Next tree lesson <span>→</span></button></section>
        </div>
      </section>
    </main>
  );
}
