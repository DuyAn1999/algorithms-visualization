"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  algorithmMeta,
  binarySearchLesson,
  bubbleSortLesson,
  countingSortLesson,
  heapSortLesson,
  insertionSortLesson,
  linearSearchLesson,
  mergeSortLesson,
  quickSortLesson,
  radixSortLesson,
  selectionSortLesson,
  type AlgorithmLessonId,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type { VisualizationStep } from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";
import { CourseMenu } from "./course-menu";
import { usePlaybackShortcuts } from "./use-playback-shortcuts";
import { ProgressBadge } from "./progress-badge";
import { parseCompletedLessons, readLocalValue, writeLocalValue } from "@/lib/local-progress.ts";

const lessonOrder: AlgorithmLessonId[] = [
  "linear-search", "binary-search", "bubble-sort", "selection-sort", "insertion-sort",
  "merge-sort", "quick-sort", "heap-sort", "counting-sort", "radix-sort",
];

const definitions = {
  "linear-search": linearSearchLesson,
  "binary-search": binarySearchLesson,
  "bubble-sort": bubbleSortLesson,
  "selection-sort": selectionSortLesson,
  "insertion-sort": insertionSortLesson,
  "merge-sort": mergeSortLesson,
  "quick-sort": quickSortLesson,
  "heap-sort": heapSortLesson,
  "counting-sort": countingSortLesson,
  "radix-sort": radixSortLesson,
} as const;

const defaults: Record<AlgorithmLessonId, number[]> = {
  "linear-search": [42, 18, 67, 33, 55, 12, 74, 28],
  "binary-search": [8, 17, 24, 31, 39, 46, 55, 63],
  "bubble-sort": [42, 18, 67, 33, 55, 12, 74, 28],
  "selection-sort": [42, 18, 67, 33, 55, 12, 74, 28],
  "insertion-sort": [12, 18, 33, 28, 42, 55, 67, 74],
  "merge-sort": [42, 18, 67, 33, 55, 12, 74, 28],
  "quick-sort": [42, 18, 67, 33, 55, 12, 74, 28],
  "heap-sort": [42, 18, 67, 33, 55, 12, 74, 28],
  "counting-sort": [4, 2, 2, 8, 3, 3, 1],
  "radix-sort": [170, 45, 75, 90, 802, 24, 2, 66],
};

function ArrayStage({ step }: { step: VisualizationStep }) {
  const values = step.frame.items.map((item) => Number(item.value));
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(1, max - min);
  const columns = { gridTemplateColumns: `repeat(${Math.max(step.frame.items.length, 1)}, minmax(24px, 1fr))` };
  return (
    <div className="algorithm-array-stage">
      <div className="structure-caption">{step.frame.caption}</div>
      {step.frame.pointers?.length ? <div className="search-pointer-row">{step.frame.pointers.map((pointer) => <span key={pointer.id}>{pointer.label} → {pointer.itemId?.replace("array-", "index ")}</span>)}</div> : null}
      <div className="array-bars" style={columns}>
        {step.frame.items.map((item) => {
          const numeric = Number(item.value);
          const height = 42 + ((numeric - min) / range) * 150;
          return <div className="bar-slot" key={item.id}><div className={`value-bar state-${item.state}`} style={{ height: `${height}px` }}>{item.value}</div></div>;
        })}
      </div>
      <div className="array-indices" style={columns}>{step.frame.items.map((item) => <span key={item.id}>{item.label?.replace("index ", "[") + "]"}</span>)}</div>
      <div className="visual-legend"><span><i className="legend-active" />current comparison</span><span><i className="legend-completed" />settled / found</span><span><i className="legend-idle" />waiting</span></div>
    </div>
  );
}

function BucketStage({ step }: { step: VisualizationStep }) {
  return (
    <div className="bucket-stage">
      <div className="structure-caption">{step.frame.caption}</div>
      <div className="bucket-grid">
        {step.frame.items.map((item) => <div className={`bucket-card state-${item.state}`} key={item.id}><small>{item.label}</small><strong>{item.value}</strong></div>)}
      </div>
      <div className="stage-help">Each labeled box groups equal values or equal digits—no pairwise comparison needed.</div>
    </div>
  );
}

function UsageSection({ lessonId }: { lessonId: AlgorithmLessonId }) {
  const usage = algorithmMeta[lessonId].usage;
  return (
    <section className="usage-section" aria-label={`${algorithmMeta[lessonId].title} usage guide`}>
      <div className="usage-heading"><span>USE IT WITH CONFIDENCE</span><h2>Where this algorithm is useful</h2><p>{usage.summary}</p></div>
      <div className="usage-grid">
        <div className="usage-card choose-card"><span className="usage-icon">✓</span><div><small>Choose it when</small><p>{usage.chooseWhen}</p></div></div>
        <div className="usage-card avoid-card"><span className="usage-icon">!</span><div><small>Think twice when</small><p>{usage.avoidWhen}</p></div></div>
        <div className="usage-card examples-card"><small>Real examples</small><ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul></div>
        <div className="usage-card complexity-card"><small>Cost guide</small><div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div></div>
      </div>
      <div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button type="button" onClick={() => document.querySelector(".lesson-toolbar")?.scrollIntoView({ behavior: "smooth" })}>Change the input ↑</button></div>
    </section>
  );
}

export function SortingSearchingLab() {
  const [lessonId, setLessonId] = useState<AlgorithmLessonId>("linear-search");
  const [values, setValues] = useState(defaults["linear-search"]);
  const [draft, setDraft] = useState(defaults["linear-search"].join(", "));
  const [target, setTarget] = useState(55);
  const [inputError, setInputError] = useState("");
  const [completed, setCompleted] = useState<AlgorithmLessonId[]>([]);
  const isSearch = lessonId === "linear-search" || lessonId === "binary-search";

  const demo = useMemo(() => {
    if (lessonId === "linear-search") return createTimeline(linearSearchLesson, { values, target });
    if (lessonId === "binary-search") return createTimeline(binarySearchLesson, { values, target });
    if (lessonId === "bubble-sort") return createTimeline(bubbleSortLesson, { values });
    if (lessonId === "selection-sort") return createTimeline(selectionSortLesson, { values });
    if (lessonId === "insertion-sort") return createTimeline(insertionSortLesson, { values });
    if (lessonId === "merge-sort") return createTimeline(mergeSortLesson, { values });
    if (lessonId === "quick-sort") return createTimeline(quickSortLesson, { values });
    if (lessonId === "heap-sort") return createTimeline(heapSortLesson, { values });
    if (lessonId === "counting-sort") return createTimeline(countingSortLesson, { values });
    return createTimeline(radixSortLesson, { values });
  }, [lessonId, target, values]);

  const player = useVisualizationPlayer(demo);
  const meta = algorithmMeta[lessonId];
  const step = player.currentStep;
  const definition = definitions[lessonId];

  useEffect(() => {
    const restored = parseCompletedLessons(readLocalValue("algolab-sorting-progress"), lessonOrder);
    queueMicrotask(() => setCompleted(restored));
  }, []);

  useEffect(() => {
    if (player.state.status !== "completed") return;
    // Parse before scheduling: malformed stored data must never escape a microtask.
    queueMicrotask(() => setCompleted((previous) => {
      if (previous.includes(lessonId)) return previous;
      const next = [...new Set([...parseCompletedLessons(readLocalValue("algolab-sorting-progress"), lessonOrder), ...previous, lessonId])];
      writeLocalValue("algolab-sorting-progress", JSON.stringify(next));
      return next;
    }));
  }, [lessonId, player.state.status]);

  usePlaybackShortcuts(player);

  const selectLesson = (next: AlgorithmLessonId) => {
    player.reset();
    const nextValues = defaults[next];
    setLessonId(next); setValues(nextValues); setDraft(nextValues.join(", ")); setInputError("");
    if (next === "binary-search") setTarget(39);
    else if (next === "linear-search") setTarget(55);
  };

  const applyDraft = () => {
    const parsed = draft.split(",").map((part) => Number(part.trim()));
    if (parsed.length < 2 || parsed.length > 12 || parsed.some((value) => !Number.isInteger(value))) { setInputError("Enter 2–12 whole numbers separated by commas."); return; }
    if (lessonId === "counting-sort" && parsed.some((value) => value < 0 || value > 20)) { setInputError("Counting Sort uses values from 0 to 20 in this lab."); return; }
    if (lessonId === "radix-sort" && parsed.some((value) => value < 0 || value > 999)) { setInputError("Radix Sort uses values from 0 to 999 in this lab."); return; }
    const normalized = lessonId === "binary-search" ? [...parsed].sort((a, b) => a - b) : parsed;
    player.reset(); setValues(normalized); setDraft(normalized.join(", ")); setInputError("");
  };

  const shuffle = () => {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]]; }
    const normalized = lessonId === "binary-search" ? shuffled.sort((a, b) => a - b) : shuffled;
    player.reset(); setValues(normalized); setDraft(normalized.join(", ")); setInputError("");
  };

  const nextLesson = () => selectLesson(lessonOrder[(lessonOrder.indexOf(lessonId) + 1) % lessonOrder.length]);

  return (
    <main className="app-shell">
      <aside className="sidebar linear-sidebar algorithm-sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div>
        <div className="checkpoint-progress"><div><span>Search & sort</span><strong>{completed.length} / 10</strong></div><div className="progress-track"><span style={{ width: `${completed.length * 10}%` }} /></div></div>
        <nav aria-label="Searching and sorting lessons">
          <p>Previous checkpoint</p><Link className="nav-section-link" href="/linear-structures"><span>✓</span><b>Linear structures</b></Link>
          <p>Search & sort</p>
          {lessonOrder.map((id, index) => <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}><span>{algorithmMeta[id].shortLabel}</span><b>{algorithmMeta[id].navLabel}</b><i>{completed.includes(id) ? "✓" : String(index + 1).padStart(2, "0")}</i></button>)}
          <p>Coming next</p><Link className="nav-section-link" href="/tree-foundations"><span>06</span><b>Tree foundations</b></Link>
        </nav>
        <div className="sidebar-tip"><span>✦</span><p><strong>Read the colors</strong><small>Orange is the current decision. Lime means a value is settled or found.</small></p></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span>Checkpoint 5</span><b>/</b><strong>Searching & sorting</strong></div><div className="topbar-actions"><CourseMenu currentPath="/sorting-searching" /><ProgressBadge /></div></header>
        <div className="page-content linear-content">
          <label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as AlgorithmLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{algorithmMeta[id].navLabel}</option>)}</select></label>
          <section className="page-heading foundation-heading"><div><span className="eyebrow">ALGORITHM {lessonOrder.indexOf(lessonId) + 1} OF 10 · TEST YOUR OWN DATA</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div></section>
          <section className="concept-strip"><div className="analogy-mark">{meta.shortLabel}</div><div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div><span>{meta.rule}</span></section>
          <section className="lesson-toolbar algorithm-toolbar">
            <div className="algorithm-inputs"><label>Test values<input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyDraft()} aria-invalid={Boolean(inputError)} /></label>{isSearch && <label>Target<input type="number" value={target} onChange={(event) => setTarget(Number(event.target.value))} /></label>}<button type="button" onClick={applyDraft}>Apply</button><button type="button" className="secondary-action" onClick={shuffle}>Shuffle</button></div>
            <div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div>
            <div className="input-feedback"><span>{meta.inputHint}</span>{inputError && <strong role="alert">{inputError}</strong>}</div>
          </section>

          <section className="learning-grid foundation-learning-grid">
            <article className="visual-card"><div className="card-header"><div><span className="live-dot" /><strong>Visual playground</strong></div><span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.steps.length}</span></div>
              <div className="visual-stage algorithm-visual-stage">{step.frame.layout === "buckets" ? <BucketStage step={step} /> : <ArrayStage step={step} />}</div>
              <div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div>
              <div className="playback-controls"><button onClick={player.reset} aria-label="Reset visualization">↺</button><button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button><button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>{player.state.status === "playing" ? "Ⅱ" : "▶"}</button><button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button><label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label></div>
              <div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.steps.length) * 100)}%` }} /></div>
            </article>
            <aside className="code-card foundation-code-card"><div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div><div className="code-lines">{definition.code.map((line, index) => <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div><div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div></aside>
          </section>
          <UsageSection lessonId={lessonId} />
          <section className="next-lesson-strip"><div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div><button onClick={nextLesson}>Next algorithm <span>→</span></button></section>
        </div>
      </section>
    </main>
  );
}
