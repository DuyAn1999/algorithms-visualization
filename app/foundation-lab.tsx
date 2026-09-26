"use client";

import { useEffect, useMemo, useState } from "react";
import {
  arrayAccessLesson,
  bigOLesson,
  factorialLesson,
  foundationMeta,
  matrixScanLesson,
  stringScanLesson,
  type FoundationLessonId,
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

const lessonOrder: FoundationLessonId[] = [
  "arrays",
  "strings",
  "matrices",
  "recursion",
  "big-o",
];

type FoundationDemo = {
  definition: Pick<LessonDefinition<object>, "category" | "code">;
  timeline: VisualizationTimeline<object>;
  inputLabel: string;
  inputValue: string;
};

function Cell({ item }: { item: VisualItem }) {
  return (
    <div className={`foundation-cell state-${item.state}`}>
      <strong>{item.value === " " ? "␠" : item.value}</strong>
      <span>{item.label}</span>
    </div>
  );
}

function LinearStage({ step }: { step: VisualizationStep }) {
  return (
    <div className="linear-stage">
      <div className="foundation-caption">{step.frame.caption}</div>
      <div className={`linear-cells ${step.frame.layout === "string" ? "string-cells" : ""}`}>
        {step.frame.items.map((item) => <Cell item={item} key={item.id} />)}
      </div>
      <div className="stage-help">
        {step.frame.layout === "string"
          ? "Characters keep their left-to-right order"
          : "The index is the address of a value"}
      </div>
    </div>
  );
}

function MatrixStage({ step }: { step: VisualizationStep }) {
  return (
    <div className="matrix-stage">
      <div className="foundation-caption">{step.frame.caption}</div>
      <div
        className="matrix-grid"
        style={{ gridTemplateColumns: `repeat(${step.frame.columns ?? 3}, minmax(54px, 76px))` }}
      >
        {step.frame.items.map((item) => <Cell item={item} key={item.id} />)}
      </div>
      <div className="matrix-axis"><span>row ↓</span><span>column →</span></div>
    </div>
  );
}

function RecursionStage({ step }: { step: VisualizationStep }) {
  return (
    <div className="recursion-stage">
      <div className="foundation-caption">{step.frame.caption}</div>
      <div className="call-stack">
        {step.frame.items.map((item, index) => (
          <div className={`call-frame state-${item.state}`} key={item.id}>
            <span>{index === step.frame.items.length - 1 ? "CURRENT" : "PAUSED"}</span>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
      <div className="stage-help">Calls build downward, then return values upward</div>
    </div>
  );
}

function ComplexityStage({ step }: { step: VisualizationStep }) {
  const maximum = Math.max(...step.frame.items.map((item) => Number(item.value)), 1);
  return (
    <div className="complexity-stage">
      <div className="foundation-caption">{step.frame.caption}</div>
      <div className="complexity-bars">
        {step.frame.items.map((item) => {
          const ratio = Math.log2(Number(item.value) + 1) / Math.log2(maximum + 1);
          return (
            <div className="complexity-slot" key={item.id}>
              <div className={`complexity-bar state-${item.state}`} style={{ height: `${48 + ratio * 150}px` }}>
                <strong>{item.value}</strong>
              </div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="stage-help">Bar heights use a compressed scale so every growth class stays visible</div>
    </div>
  );
}

function FoundationStage({ step }: { step: VisualizationStep }) {
  if (step.frame.layout === "matrix") return <MatrixStage step={step} />;
  if (step.frame.layout === "recursion") return <RecursionStage step={step} />;
  if (step.frame.layout === "complexity") return <ComplexityStage step={step} />;
  return <LinearStage step={step} />;
}

function UsageSection({ lessonId }: { lessonId: FoundationLessonId }) {
  const usage = foundationMeta[lessonId].usage;
  return (
    <section className="usage-section" aria-label={`${foundationMeta[lessonId].title} usage guide`}>
      <div className="usage-heading">
        <span>USE IT WITH CONFIDENCE</span>
        <h2>Where this idea is useful</h2>
        <p>{usage.summary}</p>
      </div>
      <div className="usage-grid">
        <div className="usage-card choose-card">
          <span className="usage-icon">✓</span>
          <div><small>Choose it when</small><p>{usage.chooseWhen}</p></div>
        </div>
        <div className="usage-card avoid-card">
          <span className="usage-icon">!</span>
          <div><small>Think twice when</small><p>{usage.avoidWhen}</p></div>
        </div>
        <div className="usage-card examples-card">
          <small>Real examples</small>
          <ul>{usage.examples.map((example) => <li key={example}><span>↳</span>{example}</li>)}</ul>
        </div>
        <div className="usage-card complexity-card">
          <small>Cost guide</small>
          <div>{usage.operations.map((operation) => <p key={operation.name}><span>{operation.name}</span><strong>{operation.cost}</strong></p>)}</div>
        </div>
      </div>
      <div className="practice-strip"><span>Practice next</span><strong>{usage.practice}</strong><button>Save for later</button></div>
    </section>
  );
}

export function FoundationLab() {
  const [lessonId, setLessonId] = useState<FoundationLessonId>("arrays");
  const [arrayIndex, setArrayIndex] = useState(3);
  const [stringTarget, setStringTarget] = useState("r");
  const [matrixTarget, setMatrixTarget] = useState(7);
  const [factorialN, setFactorialN] = useState(4);
  const [bigON, setBigON] = useState(16);
  const [completed, setCompleted] = useState<FoundationLessonId[]>([]);

  const demo = useMemo<FoundationDemo>(() => {
    if (lessonId === "strings") {
      return {
        definition: stringScanLesson,
        timeline: createTimeline(stringScanLesson, { text: "algorithm", target: stringTarget }),
        inputLabel: "Find character",
        inputValue: stringTarget,
      };
    }
    if (lessonId === "matrices") {
      return {
        definition: matrixScanLesson,
        timeline: createTimeline(matrixScanLesson, {
          values: [[3, 8, 2], [5, 1, 7], [9, 4, 6]],
          target: matrixTarget,
        }),
        inputLabel: "Find value",
        inputValue: String(matrixTarget),
      };
    }
    if (lessonId === "recursion") {
      return {
        definition: factorialLesson,
        timeline: createTimeline(factorialLesson, { n: factorialN }),
        inputLabel: "Factorial input",
        inputValue: String(factorialN),
      };
    }
    if (lessonId === "big-o") {
      return {
        definition: bigOLesson,
        timeline: createTimeline(bigOLesson, { n: bigON }),
        inputLabel: "Input size n",
        inputValue: String(bigON),
      };
    }
    return {
      definition: arrayAccessLesson,
      timeline: createTimeline(arrayAccessLesson, {
        values: [14, 28, 35, 42, 57, 63],
        index: arrayIndex,
      }),
      inputLabel: "Read index",
      inputValue: String(arrayIndex),
    };
  }, [arrayIndex, bigON, factorialN, lessonId, matrixTarget, stringTarget]);

  const player = useVisualizationPlayer(demo.timeline);
  const meta = foundationMeta[lessonId];
  const step = player.currentStep;

  useEffect(() => {
    const restored = parseCompletedLessons(readLocalValue("algolab-foundation-progress"), lessonOrder);
    queueMicrotask(() => setCompleted(restored));
  }, []);

  useEffect(() => {
    if (player.state.status !== "completed") return;
    // Parse before scheduling: malformed stored data must never escape a microtask.
    queueMicrotask(() => setCompleted((previous) => {
      if (previous.includes(lessonId)) return previous;
      const next = [...new Set([...parseCompletedLessons(readLocalValue("algolab-foundation-progress"), lessonOrder), ...previous, lessonId])];
      writeLocalValue("algolab-foundation-progress", JSON.stringify(next));
      return next;
    }));
  }, [lessonId, player.state.status]);

  usePlaybackShortcuts(player);

  const selectLesson = (nextLesson: FoundationLessonId) => {
    player.reset();
    setLessonId(nextLesson);
  };

  const selectNextLesson = () => {
    const current = lessonOrder.indexOf(lessonId);
    selectLesson(lessonOrder[(current + 1) % lessonOrder.length]);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar foundation-sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>AlgoLab</strong><small>Learn by seeing</small></span>
        </div>
        <div className="checkpoint-progress">
          <div><span>Foundation path</span><strong>{completed.length} / 5</strong></div>
          <div className="progress-track"><span style={{ width: `${completed.length * 20}%` }} /></div>
        </div>
        <nav aria-label="Foundation lessons">
          <p>Foundation lessons</p>
          {lessonOrder.map((id, index) => {
            const lesson = foundationMeta[id];
            return (
              <button className={`nav-item ${lessonId === id ? "active" : ""}`} onClick={() => selectLesson(id)} key={id}>
                <span>{lesson.shortLabel}</span>
                <b>{lesson.navLabel}</b>
                <i>{completed.includes(id) ? "✓" : `0${index + 1}`}</i>
              </button>
            );
          })}
          <p>Coming next</p>
          <a className="nav-section-link" href="/linear-structures"><span>04</span><b>Linear structures</b></a>
        </nav>
        <div className="sidebar-tip"><span>✦</span><p><strong>Beginner tip</strong><small>Say what you expect before revealing the next step.</small></p></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span>Checkpoint 3</span><b>/</b><strong>Foundations</strong></div>
          <div className="topbar-actions"><CourseMenu currentPath="/" /><ProgressBadge /></div>
        </header>

        <div className="page-content foundation-content">
          <label className="mobile-lesson-select">Choose lesson<select value={lessonId} onChange={(event) => selectLesson(event.target.value as FoundationLessonId)}>{lessonOrder.map((id) => <option value={id} key={id}>{foundationMeta[id].navLabel}</option>)}</select></label>
          <section className="page-heading foundation-heading">
            <div>
              <span className="eyebrow">FOUNDATION {lessonOrder.indexOf(lessonId) + 1} OF 5 · GUIDED LESSON</span>
              <h1>{meta.title}</h1>
              <p>{meta.description}</p>
            </div>
            <div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard controls</strong><small>Space · ← → · R</small></p></div>
          </section>

          <section className="concept-strip">
            <div className="analogy-mark">{meta.shortLabel}</div>
            <div><small>Start with a familiar picture · {meta.analogy}</small><strong>{meta.concept}</strong></div>
            <span>{meta.rule}</span>
          </section>

          <section className="lesson-toolbar">
            <div className="lesson-input">
              <label>{demo.inputLabel}</label>
              {lessonId === "strings" ? (
                <input value={stringTarget} maxLength={1} onChange={(event) => event.target.value && setStringTarget(event.target.value)} aria-label="Character to find" />
              ) : lessonId === "arrays" ? (
                <input type="range" min="0" max="5" value={arrayIndex} onChange={(event) => setArrayIndex(Number(event.target.value))} aria-label="Array index" />
              ) : lessonId === "matrices" ? (
                <input type="number" min="0" max="9" value={matrixTarget} onChange={(event) => setMatrixTarget(Number(event.target.value))} aria-label="Matrix target value" />
              ) : lessonId === "recursion" ? (
                <input type="range" min="2" max="6" value={factorialN} onChange={(event) => setFactorialN(Number(event.target.value))} aria-label="Factorial input" />
              ) : (
                <input type="range" min="2" max="64" step="2" value={bigON} onChange={(event) => setBigON(Number(event.target.value))} aria-label="Big O input size" />
              )}
              <strong>{demo.inputValue}</strong>
            </div>
            <div className="lesson-status"><span className={`status-dot status-${player.state.status}`} />{player.state.status === "idle" ? "Ready to explore" : player.state.status}</div>
          </section>

          <section className="learning-grid foundation-learning-grid">
            <article className="visual-card">
              <div className="card-header">
                <div><span className="live-dot" /><strong>Visual playground</strong></div>
                <span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.timeline.steps.length}</span>
              </div>
              <div className="visual-stage foundation-visual-stage"><FoundationStage step={step} /></div>
              <div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div>
              <div className="playback-controls">
                <button onClick={player.reset} aria-label="Reset visualization">↺</button>
                <button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button>
                <button className="play-button" onClick={player.state.status === "playing" ? player.pause : player.play} aria-label={player.state.status === "playing" ? "Pause" : "Play"}>
                  {player.state.status === "playing" ? "Ⅱ" : "▶"}
                </button>
                <button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button>
                <label className="speed-control"><span>Speed <b>{player.state.speed}×</b></span><input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} /></label>
              </div>
              <div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.timeline.steps.length) * 100)}%` }} /></div>
            </article>

            <aside className="code-card foundation-code-card">
              <div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Follows each step</span></div>
              <div className="code-lines">
                {demo.definition.code.map((line, index) => (
                  <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}>
                    <span>{index + 1}</span><code>{line || " "}</code>
                  </div>
                ))}
              </div>
              <div className="event-readout"><span>Current action</span><strong>{step.operation.replaceAll("-", " ")}</strong><small>{step.frame.caption}</small></div>
            </aside>
          </section>

          <UsageSection lessonId={lessonId} />

          <section className="next-lesson-strip">
            <div><small>Checkpoint progress</small><strong>{completed.includes(lessonId) ? "Lesson explored ✓" : "Complete the steps to mark this lesson explored"}</strong></div>
            <button onClick={selectNextLesson}>Next foundation <span>→</span></button>
          </section>
        </div>
      </section>
    </main>
  );
}
