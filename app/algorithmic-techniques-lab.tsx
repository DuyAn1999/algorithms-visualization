"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  backtrackingLesson,
  bruteForceLesson,
  divideConquerLesson,
  dynamicProgrammingLesson,
  greedyLesson,
  memoizationLesson,
  slidingWindowLesson,
  techniqueMeta,
  type TechniqueInput,
  type TechniqueLessonId,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type { VisualizationStep } from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";

const lessonOrder: TechniqueLessonId[] = ["brute-force", "divide-conquer", "greedy", "memoization", "dynamic-programming", "backtracking", "sliding-window"];
const definitions = { "brute-force": bruteForceLesson, "divide-conquer": divideConquerLesson, greedy: greedyLesson, memoization: memoizationLesson, "dynamic-programming": dynamicProgrammingLesson, backtracking: backtrackingLesson, "sliding-window": slidingWindowLesson } as const;
const presets: Record<TechniqueLessonId, TechniqueInput> = {
  "brute-force": { values: [7, 1, 9, 4, 6], target: 10 },
  "divide-conquer": { values: [7, 1, 9, 4, 6, 2, 8], target: 0 },
  greedy: { values: [1, 5, 10, 25], target: 63 },
  memoization: { values: [], target: 6 },
  "dynamic-programming": { values: [1, 3, 4], target: 6 },
  backtracking: { values: [3, 4, 5, 2], target: 9 },
  "sliding-window": { values: [2, 1, 5, 1, 3, 2], target: 3 },
};

function TechniqueStage({ step }: { step: VisualizationStep }) {
  const recursion = step.frame.layout === "recursion";
  return (
    <div className={`technique-stage ${recursion ? "technique-recursion-stage" : ""}`}>
      <div className="structure-caption">{step.frame.caption}</div>
      {recursion ? (
        <div className="call-stack technique-call-stack">
          {step.frame.items.map((item, index) => <div className={`call-frame state-${item.state}`} key={item.id}><span>{index === step.frame.items.length - 1 ? "CURRENT" : "PAUSED"}</span><strong>{item.value}</strong><small>{item.label}</small></div>)}
        </div>
      ) : (
        <div className={`technique-cell-grid ${step.frame.items.length > 14 ? "compact" : ""}`}>
          {step.frame.items.map((item) => {
            const pointers = step.frame.pointers?.filter((pointer) => pointer.itemId === item.id) ?? [];
            return <div className="technique-cell-slot" key={item.id}><div className={`foundation-cell state-${item.state}`}><strong>{item.value}</strong><span>{item.label}</span></div><div className="technique-pointer-labels">{pointers.map((pointer) => <small key={pointer.id}>{pointer.label}</small>)}</div></div>;
          })}
        </div>
      )}
      <div className="traversal-output technique-output"><small>RUNNING RESULT / MEMORY</small><div>{step.frame.output?.length ? step.frame.output.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <em>The technique’s working result appears here</em>}</div></div>
      <div className="visual-legend"><span><i className="legend-active" />current work</span><span><i className="legend-completed" />accepted / remembered</span><span><i className="legend-idle" />not used yet</span></div>
    </div>
  );
}

function UsageSection({ lessonId }: { lessonId: TechniqueLessonId }) {
  const usage = techniqueMeta[lessonId].usage;
  return <section className="usage-section" aria-label={`${techniqueMeta[lessonId].title} usage guide`}><div className="usage-heading"><span>CHOOSE THE APPROACH DELIBERATELY</span><h2>Where this technique is useful</h2><p>{usage.summary}</p></div><div className="usage-grid"><div className="usage-card choose-card"><span className="usage-icon">✓</span><div><small>Choose it when</small><p>{usage.chooseWhen}</p></div></div><div className="usage-card avoid-card"><span className="usage-icon">!</span><div><small>Think twice when</small><p>{usage.avoidWhen}</p></div></div><div className="usage-card examples-card"><small>Real examples</small><ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul></div><div className="usage-card complexity-card"><small>Cost guide</small><div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div></div></div><div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button type="button" onClick={() => document.querySelector(".lesson-toolbar")?.scrollIntoView({ behavior: "smooth" })}>Change the problem ↑</button></div></section>;
}

export function AlgorithmicTechniquesLab() {
  const initial = presets["brute-force"];
  const [lessonId, setLessonId] = useState<TechniqueLessonId>("brute-force");
  const [values, setValues] = useState(initial.values);
  const [target, setTarget] = useState(initial.target);
  const [valuesDraft, setValuesDraft] = useState(initial.values.join(", "));
  const [targetDraft, setTargetDraft] = useState(String(initial.target));
  const [inputError, setInputError] = useState("");
  const [completed, setCompleted] = useState<TechniqueLessonId[]>([]);
  const definition = definitions[lessonId]; const meta = techniqueMeta[lessonId];
  const demo = useMemo(() => createTimeline(definition, { values, target }), [definition, target, values]);
  const player = useVisualizationPlayer(demo); const step = player.currentStep;

  useEffect(() => { const stored = window.localStorage.getItem("algolab-technique-progress"); if (!stored) return; try { const parsed = JSON.parse(stored) as TechniqueLessonId[]; queueMicrotask(() => setCompleted(parsed.filter((id) => lessonOrder.includes(id)))); } catch { window.localStorage.removeItem("algolab-technique-progress"); } }, []);
  useEffect(() => { if (player.state.status !== "completed") return; queueMicrotask(() => setCompleted((previous) => { if (previous.includes(lessonId)) return previous; const next = [...previous, lessonId]; window.localStorage.setItem("algolab-technique-progress", JSON.stringify(next)); return next; })); }, [lessonId, player.state.status]);
  useEffect(() => { const handleKeyboard = (event: KeyboardEvent) => { const element = event.target as HTMLElement | null; if (["INPUT", "BUTTON", "SELECT"].includes(element?.tagName ?? "")) return; if (event.code === "Space") { event.preventDefault(); if (player.state.status === "playing") player.pause(); else player.play(); } if (event.key === "ArrowRight") player.next(); if (event.key === "ArrowLeft") player.previous(); if (event.key.toLowerCase() === "r") player.reset(); }; window.addEventListener("keydown", handleKeyboard); return () => window.removeEventListener("keydown", handleKeyboard); }, [player]);

  const selectLesson = (next: TechniqueLessonId) => { const preset = presets[next]; player.reset(); setLessonId(next); setValues([...preset.values]); setTarget(preset.target); setValuesDraft(preset.values.join(", ")); setTargetDraft(String(preset.target)); setInputError(""); };
  const applyInput = () => { const parsedValues = meta.usesValues ? valuesDraft.split(",").map((value) => value.trim()).filter(Boolean).map(Number) : []; const parsedTarget = meta.usesTarget ? Number(targetDraft) : 0; const validation = definition.validate({ values: parsedValues, target: parsedTarget }); if (!validation.valid) { setInputError(validation.message); return; } player.reset(); setValues(parsedValues); setTarget(parsedTarget); setValuesDraft(parsedValues.join(", ")); setTargetDraft(String(parsedTarget)); setInputError(""); };
  const resetExample = () => { const preset = presets[lessonId]; player.reset(); setValues([...preset.values]); setTarget(preset.target); setValuesDraft(preset.values.join(", ")); setTargetDraft(String(preset.target)); setInputError(""); };
  const nextLesson = () => selectLesson(lessonOrder[(lessonOrder.indexOf(lessonId) + 1) % lessonOrder.length]);

  return <main className="app-shell"><aside className="sidebar linear-sidebar technique-sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div><div className="checkpoint-progress"><div><span>Techniques</span><strong>{completed.length} / 7</strong></div><div className="progress-track"><span style={{ width: `${completed.length * (100 / 7)}%` }} /></div></div><nav aria-label="Algorithmic technique lessons"><p>Previous checkpoint</p><Link className="nav-section-link" href="/weighted-graphs"><span>✓</span><b>Weighted graphs</b></Link><p>Algorithmic techniques</p>{lessonOrder.map((id, index) => <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}><span>{techniqueMeta[id].shortLabel}</span><b>{techniqueMeta[id].navLabel}</b><i>{completed.includes(id) ? "✓" : String(index + 1).padStart(2, "0")}</i></button>)}<p>Milestone</p><div className="nav-item locked"><span>★</span><b>Core curriculum</b><i>final</i></div></nav><div className="sidebar-tip"><span>✦</span><p><strong>Watch what is reused</strong><small>Orange is current work. Lime shows a result, choice, or state the technique keeps.</small></p></div></aside>
    <section className="workspace"><header className="topbar"><div><span>Checkpoint 10</span><b>/</b><strong>Algorithmic techniques</strong></div><span className="local-badge"><i />Progress saved locally</span></header><div className="page-content linear-content"><label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as TechniqueLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{techniqueMeta[id].navLabel}</option>)}</select></label>
      <section className="page-heading foundation-heading"><div><span className="eyebrow">TECHNIQUE {lessonOrder.indexOf(lessonId) + 1} OF 7 · LEARN THE STRATEGY</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div></section><section className="concept-strip"><div className="analogy-mark">{meta.shortLabel}</div><div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div><span>{meta.rule}</span></section>
      <section className="lesson-toolbar algorithm-toolbar technique-toolbar"><div className="algorithm-inputs technique-inputs">{meta.usesValues && <label>{meta.valueLabel}<input type="text" value={valuesDraft} onChange={(event) => setValuesDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyInput()} aria-invalid={Boolean(inputError)} /></label>}{meta.usesTarget && <label>{meta.targetLabel}<input type="number" value={targetDraft} onChange={(event) => setTargetDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyInput()} aria-invalid={Boolean(inputError)} /></label>}<button type="button" onClick={applyInput}>Apply</button><button type="button" className="secondary-action" onClick={resetExample}>Reset example</button></div><div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div><div className="input-feedback"><span>{meta.inputHint}</span>{inputError && <strong role="alert">{inputError}</strong>}</div></section>
      <section className="learning-grid foundation-learning-grid"><article className="visual-card"><div className="card-header"><div><span className="live-dot" /><strong>Strategy playground</strong></div><span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.steps.length}</span></div><div className="visual-stage technique-visual-stage"><TechniqueStage step={step} /></div><div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div><div className="playback-controls"><button onClick={player.reset} aria-label="Reset visualization">↺</button><button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button><button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>{player.state.status === "playing" ? "Ⅱ" : "▶"}</button><button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button><label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label></div><div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.steps.length) * 100)}%` }} /></div></article>
        <aside className="code-card foundation-code-card"><div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div><div className="code-lines">{definition.code.map((line, index) => <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div><div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div></aside></section>
      <UsageSection lessonId={lessonId} /><section className="next-lesson-strip"><div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div><button onClick={nextLesson}>Next technique <span>→</span></button></section></div></section></main>;
}
