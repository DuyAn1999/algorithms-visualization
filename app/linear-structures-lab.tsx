"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  circularLinkedListLesson,
  circularQueueLesson,
  dequeLesson,
  doublyLinkedListLesson,
  hashTableLesson,
  linearMeta,
  queueOperationLesson,
  singlyLinkedListLesson,
  stackOperationLesson,
  type DequeInput,
  type LinearLessonId,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type {
  LessonDefinition,
  VisualizationStep,
  VisualizationTimeline,
  VisualItem,
} from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";
import { CourseMenu } from "./course-menu";
import { usePlaybackShortcuts } from "./use-playback-shortcuts";
import { ProgressBadge } from "./progress-badge";
import { parseCompletedLessons, readLocalValue, writeLocalValue } from "@/lib/local-progress.ts";

const lessonOrder: LinearLessonId[] = [
  "singly-linked-list",
  "doubly-linked-list",
  "circular-linked-list",
  "stack",
  "queue",
  "circular-queue",
  "deque",
  "hash-table",
];

type LinearDemo = {
  definition: Pick<LessonDefinition<object>, "code">;
  timeline: VisualizationTimeline<object>;
  inputSummary: string;
};

function PointerNode({ item, mode }: { item: VisualItem; mode: "single" | "double" }) {
  return (
    <div className={`pointer-node state-${item.state}`}>
      <div><small>value</small><strong>{item.value}</strong></div>
      <div className="pointer-field"><small>{mode === "double" ? "prev · next" : "next"}</small><span>{mode === "double" ? "← · →" : "→"}</span></div>
      <em>{item.label}</em>
    </div>
  );
}

function LinkedListStage({ step }: { step: VisualizationStep }) {
  const isDouble = step.frame.layout === "doubly-linked-list";
  const isCircular = step.frame.layout === "circular-linked-list";
  return (
    <div className="linked-stage">
      <div className="structure-caption">{step.frame.caption}</div>
      <div className="pointer-labels">
        {step.frame.pointers?.map((pointer) => <span key={pointer.id}>{pointer.label}</span>)}
      </div>
      <div className="linked-row">
        {step.frame.items.map((item, index) => (
          <div className="linked-unit" key={item.id}>
            <PointerNode item={item} mode={isDouble ? "double" : "single"} />
            {index < step.frame.items.length - 1 && <span className="link-arrow">{isDouble ? "⇄" : "→"}</span>}
          </div>
        ))}
      </div>
      {isCircular ? <div className="circular-return"><span>TAIL</span><b>↺ next returns to HEAD</b><span>HEAD</span></div> : <div className="null-marker">Last next → None</div>}
    </div>
  );
}

function LinearNode({ item }: { item: VisualItem }) {
  return (
    <div className={`linear-node state-${item.state}`}>
      <strong>{item.value}</strong>
      <span>{item.label}</span>
    </div>
  );
}

function EndsStage({ step }: { step: VisualizationStep }) {
  const isStack = step.frame.layout === "stack";
  const isDeque = step.frame.layout === "deque";
  return (
    <div className={`ends-stage ${isStack ? "vertical-stack" : ""}`}>
      <div className="structure-caption">{step.frame.caption}</div>
      <div className="ends-labels">
        {isStack ? <><span>BOTTOM</span><span>TOP · open end ↑</span></> : <><span>FRONT {isDeque ? "⇄" : "→"}</span><span>{isDeque ? "⇄" : "←"} REAR</span></>}
      </div>
      <div className={`ends-values ${isStack ? "stack-column" : ""}`}>
        {step.frame.items.length ? step.frame.items.map((item) => <LinearNode item={item} key={item.id} />) : <span className="empty-state">Empty structure</span>}
      </div>
      <div className="stage-help">{isStack ? "Push and pop both happen at TOP" : isDeque ? "Both ends accept add and remove operations" : "Older values leave before newer values"}</div>
    </div>
  );
}

function CircularQueueStage({ step }: { step: VisualizationStep }) {
  return (
    <div className="cqueue-stage">
      <div className="structure-caption">{step.frame.caption}</div>
      <div className="cqueue-ring">
        {step.frame.items.map((item) => (
          <div className={`cqueue-slot state-${item.state}`} key={item.id}>
            <small>{item.label}</small><strong>{item.value}</strong>
          </div>
        ))}
        <div className="cqueue-center"><strong>fixed array</strong><span>wraps around</span></div>
      </div>
      <div className="stage-help">After the last slot, modulo returns the pointer to slot 0</div>
    </div>
  );
}

function HashTableStage({ step }: { step: VisualizationStep }) {
  return (
    <div className="hash-stage">
      <div className="structure-caption">{step.frame.caption}</div>
      <div className="hash-table-view">
        {step.frame.items.map((item) => (
          <div className={`hash-row state-${item.state}`} key={item.id}>
            <span>{item.label}</span><strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="stage-help">A collision keeps multiple key-value pairs in the same bucket chain</div>
    </div>
  );
}

function StructureStage({ step }: { step: VisualizationStep }) {
  if (["linked-list", "doubly-linked-list", "circular-linked-list"].includes(step.frame.layout)) return <LinkedListStage step={step} />;
  if (step.frame.layout === "circular-queue") return <CircularQueueStage step={step} />;
  if (step.frame.layout === "hash-table") return <HashTableStage step={step} />;
  return <EndsStage step={step} />;
}

function UsageSection({ lessonId }: { lessonId: LinearLessonId }) {
  const usage = linearMeta[lessonId].usage;
  return (
    <section className="usage-section" aria-label={`${linearMeta[lessonId].title} usage guide`}>
      <div className="usage-heading"><span>USE IT WITH CONFIDENCE</span><h2>Where this structure is useful</h2><p>{usage.summary}</p></div>
      <div className="usage-grid">
        <div className="usage-card choose-card"><span className="usage-icon">✓</span><div><small>Choose it when</small><p>{usage.chooseWhen}</p></div></div>
        <div className="usage-card avoid-card"><span className="usage-icon">!</span><div><small>Think twice when</small><p>{usage.avoidWhen}</p></div></div>
        <div className="usage-card examples-card"><small>Real examples</small><ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul></div>
        <div className="usage-card complexity-card"><small>Cost guide</small><div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div></div>
      </div>
      <div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button>Save for later</button></div>
    </section>
  );
}

export function LinearStructuresLab() {
  const [lessonId, setLessonId] = useState<LinearLessonId>("singly-linked-list");
  const [value, setValue] = useState("25");
  const [listIndex, setListIndex] = useState(1);
  const [stackOperation, setStackOperation] = useState<"push" | "pop">("push");
  const [queueOperation, setQueueOperation] = useState<"enqueue" | "dequeue">("dequeue");
  const [dequeOperation, setDequeOperation] = useState<DequeInput["operation"]>("add-front");
  const [hashKey, setHashKey] = useState("act");
  const [completed, setCompleted] = useState<LinearLessonId[]>([]);

  const demo = useMemo<LinearDemo>(() => {
    if (lessonId === "doubly-linked-list") return { definition: doublyLinkedListLesson, timeline: createTimeline(doublyLinkedListLesson, { values: ["10", "20", "30", "40"], removeIndex: listIndex }), inputSummary: `Remove node at position ${listIndex}` };
    if (lessonId === "circular-linked-list") return { definition: circularLinkedListLesson, timeline: createTimeline(circularLinkedListLesson, { values: ["10", "20", "30"], startIndex: listIndex, visits: 4 }), inputSummary: `Start at node ${listIndex}` };
    if (lessonId === "stack") return { definition: stackOperationLesson, timeline: createTimeline(stackOperationLesson, { values: ["12", "24", "39"], operation: stackOperation, value: stackOperation === "push" ? value : undefined }), inputSummary: stackOperation === "push" ? `Push ${value}` : "Pop TOP" };
    if (lessonId === "queue") return { definition: queueOperationLesson, timeline: createTimeline(queueOperationLesson, { values: ["12", "24", "39"], operation: queueOperation, value: queueOperation === "enqueue" ? value : undefined }), inputSummary: queueOperation === "enqueue" ? `Enqueue ${value}` : "Dequeue FRONT" };
    if (lessonId === "circular-queue") return { definition: circularQueueLesson, timeline: createTimeline(circularQueueLesson, { slots: ["50", "60", null, "30", "40"], front: 3, rear: 1, value }), inputSummary: `Enqueue ${value}` };
    if (lessonId === "deque") return { definition: dequeLesson, timeline: createTimeline(dequeLesson, { values: ["20", "30", "40"], operation: dequeOperation, value: dequeOperation.startsWith("add") ? value : undefined }), inputSummary: dequeOperation.replace("-", " ") };
    if (lessonId === "hash-table") return { definition: hashTableLesson, timeline: createTimeline(hashTableLesson, { entries: [{ key: "apple", value: "4" }, { key: "dog", value: "7" }, { key: "cat", value: "9" }], key: hashKey, value: "12", capacity: 5 }), inputSummary: `Insert key “${hashKey}”` };
    return { definition: singlyLinkedListLesson, timeline: createTimeline(singlyLinkedListLesson, { values: ["10", "20", "30"], afterIndex: listIndex, value }), inputSummary: `Insert ${value} after position ${listIndex}` };
  }, [dequeOperation, hashKey, lessonId, listIndex, queueOperation, stackOperation, value]);

  const player = useVisualizationPlayer(demo.timeline);
  const meta = linearMeta[lessonId];
  const step = player.currentStep;

  useEffect(() => {
    const restored = parseCompletedLessons(readLocalValue("algolab-linear-progress"), lessonOrder);
    queueMicrotask(() => setCompleted(restored));
  }, []);

  useEffect(() => {
    if (player.state.status !== "completed") return;
    // Parse before scheduling: malformed stored data must never escape a microtask.
    queueMicrotask(() => setCompleted((previous) => {
      if (previous.includes(lessonId)) return previous;
      const next = [...new Set([...parseCompletedLessons(readLocalValue("algolab-linear-progress"), lessonOrder), ...previous, lessonId])];
      writeLocalValue("algolab-linear-progress", JSON.stringify(next));
      return next;
    }));
  }, [lessonId, player.state.status]);

  usePlaybackShortcuts(player);

  const selectLesson = (next: LinearLessonId) => {
    player.reset();
    setLessonId(next);
    if (next === "circular-linked-list") setListIndex(0);
    else setListIndex(1);
    if (next === "hash-table") setValue("25");
  };

  const nextLesson = () => selectLesson(lessonOrder[(lessonOrder.indexOf(lessonId) + 1) % lessonOrder.length]);

  const renderInputs = () => {
    if (["singly-linked-list", "doubly-linked-list", "circular-linked-list"].includes(lessonId)) {
      return <><label>{lessonId === "doubly-linked-list" ? "Remove position" : lessonId === "circular-linked-list" ? "Start position" : "Insert after"}</label><select value={listIndex} onChange={(event) => setListIndex(Number(event.target.value))}>{(lessonId === "doubly-linked-list" ? [1, 2] : lessonId === "circular-linked-list" ? [0, 1, 2] : [0, 1, 2]).map((index) => <option key={index} value={index}>{index}</option>)}</select>{lessonId === "singly-linked-list" && <><label>New value</label><input value={value} maxLength={4} onChange={(event) => event.target.value && setValue(event.target.value)} /></>}</>;
    }
    if (lessonId === "stack") return <><label>Operation</label><select value={stackOperation} onChange={(event) => setStackOperation(event.target.value as "push" | "pop")}><option value="push">Push</option><option value="pop">Pop</option></select>{stackOperation === "push" && <><label>Value</label><input value={value} maxLength={4} onChange={(event) => event.target.value && setValue(event.target.value)} /></>}</>;
    if (lessonId === "queue") return <><label>Operation</label><select value={queueOperation} onChange={(event) => setQueueOperation(event.target.value as "enqueue" | "dequeue")}><option value="enqueue">Enqueue</option><option value="dequeue">Dequeue</option></select>{queueOperation === "enqueue" && <><label>Value</label><input value={value} maxLength={4} onChange={(event) => event.target.value && setValue(event.target.value)} /></>}</>;
    if (lessonId === "deque") return <><label>Operation</label><select value={dequeOperation} onChange={(event) => setDequeOperation(event.target.value as DequeInput["operation"])}><option value="add-front">Add front</option><option value="add-rear">Add rear</option><option value="remove-front">Remove front</option><option value="remove-rear">Remove rear</option></select>{dequeOperation.startsWith("add") && <><label>Value</label><input value={value} maxLength={4} onChange={(event) => event.target.value && setValue(event.target.value)} /></>}</>;
    if (lessonId === "hash-table") return <><label>Key</label><input value={hashKey} maxLength={8} onChange={(event) => event.target.value && setHashKey(event.target.value.toLowerCase())} /><span className="input-note">Try “act” to see a collision</span></>;
    return <><label>New value</label><input value={value} maxLength={4} onChange={(event) => event.target.value && setValue(event.target.value)} /></>;
  };

  return (
    <main className="app-shell">
      <aside className="sidebar linear-sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div>
        <div className="checkpoint-progress"><div><span>Linear structures</span><strong>{completed.length} / 8</strong></div><div className="progress-track"><span style={{ width: `${completed.length * 12.5}%` }} /></div></div>
        <nav aria-label="Linear data structure lessons">
          <p>Previous checkpoint</p>
          <Link className="nav-section-link" href="/"><span>✓</span><b>Foundations</b></Link>
          <p>Linear structures</p>
          {lessonOrder.map((id, index) => {
            const lesson = linearMeta[id];
            return <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}><span>{lesson.shortLabel}</span><b>{lesson.navLabel}</b><i>{completed.includes(id) ? "✓" : String(index + 1).padStart(2, "0")}</i></button>;
          })}
          <p>Coming next</p>
          <Link className="nav-section-link" href="/sorting-searching"><span>05</span><b>Sorting & searching</b></Link>
        </nav>
        <div className="sidebar-tip"><span>✦</span><p><strong>Follow the labels</strong><small>HEAD, TAIL, TOP, FRONT, and REAR explain where operations happen.</small></p></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span>Checkpoint 4</span><b>/</b><strong>Linear data structures</strong></div><div className="topbar-actions"><CourseMenu currentPath="/linear-structures" /><ProgressBadge /></div></header>
        <div className="page-content linear-content">
          <label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as LinearLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{linearMeta[id].navLabel}</option>)}</select></label>
          <section className="page-heading foundation-heading"><div><span className="eyebrow">LINEAR STRUCTURE {lessonOrder.indexOf(lessonId) + 1} OF 8 · GUIDED OPERATION</span><h1>{meta.title}</h1><p>{meta.description}</p></div><div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div></section>
          <section className="concept-strip"><div className="analogy-mark">{meta.shortLabel}</div><div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div><span>{meta.rule}</span></section>
          <section className="lesson-toolbar"><div className="lesson-input linear-inputs">{renderInputs()}<strong>{demo.inputSummary}</strong></div><div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div></section>

          <section className="learning-grid foundation-learning-grid">
            <article className="visual-card">
              <div className="card-header"><div><span className="live-dot" /><strong>Visual playground</strong></div><span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.timeline.steps.length}</span></div>
              <div className="visual-stage linear-visual-stage"><StructureStage step={step} /></div>
              <div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div>
              <div className="playback-controls">
                <button onClick={player.reset} aria-label="Reset visualization">↺</button><button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button>
                <button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>{player.state.status === "playing" ? "Ⅱ" : "▶"}</button>
                <button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button>
                <label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label>
              </div>
              <div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.timeline.steps.length) * 100)}%` }} /></div>
            </article>

            <aside className="code-card foundation-code-card"><div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div><div className="code-lines">{demo.definition.code.map((line, index) => <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}><span>{index + 1}</span><code>{line || " "}</code></div>)}</div><div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div></aside>
          </section>

          <UsageSection lessonId={lessonId} />
          <section className="next-lesson-strip"><div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div><button onClick={nextLesson}>Next structure <span>→</span></button></section>
        </div>
      </section>
    </main>
  );
}
