"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bubbleSortLesson,
  queueOperationLesson,
  stackOperationLesson,
} from "@/lib/lessons/index.ts";
import { createTimeline } from "@/lib/visualization/index.ts";
import type {
  VisualizationStep,
  VisualizationTimeline,
  VisualItem,
} from "@/lib/visualization/types.ts";
import { useVisualizationPlayer } from "./use-visualization-player";

type DemoId = "bubble" | "stack" | "queue";

type Demo = {
  id: DemoId;
  label: string;
  shortLabel: string;
  lesson: {
    category: "algorithm" | "data-structure";
    code: readonly string[];
  };
  timeline: VisualizationTimeline<object>;
  description: string;
  rule: string;
};

function buildDemo(id: DemoId): Demo {
  if (id === "stack") {
    return {
      id,
      label: "Stack push",
      shortLabel: "Stack",
      lesson: stackOperationLesson,
      timeline: createTimeline(stackOperationLesson, {
        values: ["12", "24", "39"],
        operation: "push",
        value: "52",
      }),
      description:
        "Follow one push operation from the familiar TOP rule into the Python line that performs it.",
      rule: "Last in, first out",
    };
  }

  if (id === "queue") {
    return {
      id,
      label: "Queue dequeue",
      shortLabel: "Queue",
      lesson: queueOperationLesson,
      timeline: createTimeline(queueOperationLesson, {
        values: ["12", "24", "39", "52"],
        operation: "dequeue",
      }),
      description:
        "Watch the FRONT value leave while the REAR stays ready for new arrivals.",
      rule: "First in, first out",
    };
  }

  return {
    id,
    label: "Bubble Sort",
    shortLabel: "Sorting",
    lesson: bubbleSortLesson,
    timeline: createTimeline(bubbleSortLesson, {
      values: [42, 18, 67, 33, 55, 12, 74, 28],
    }),
    description:
      "Compare neighbors, follow each swap, and see completed values settle on the right.",
    rule: "Compare neighbors",
  };
}

function ArrayStage({ step }: { step: VisualizationStep }) {
  const values = step.frame.items.map((item) => Number(item.value));
  const maximum = Math.max(...values, 1);
  return (
    <div className="array-stage" aria-label="Array values displayed as bars">
      <div className="array-indices" aria-hidden="true">
        {step.frame.items.map((item, index) => (
          <span key={item.id}>{index}</span>
        ))}
      </div>
      <div className="array-bars">
        {step.frame.items.map((item) => (
          <div className="bar-slot" key={item.id}>
            <div
              className={`value-bar state-${item.state}`}
              style={{ height: `${42 + (Number(item.value) / maximum) * 150}px` }}
            >
              <span>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="visual-legend">
        <span><i className="legend-active" />Current action</span>
        <span><i className="legend-completed" />Completed</span>
        <span><i className="legend-idle" />Waiting</span>
      </div>
    </div>
  );
}

function StructureNode({ item }: { item: VisualItem }) {
  return (
    <div className={`structure-node state-${item.state}`}>
      <strong>{item.value}</strong>
      <span>{item.label}</span>
    </div>
  );
}

function StructureStage({ step }: { step: VisualizationStep }) {
  const isStack = step.frame.layout === "stack";
  return (
    <div className={`structure-stage ${isStack ? "is-stack" : "is-queue"}`}>
      <div className="pointer-row">
        {step.frame.pointers?.map((pointer) => (
          <span key={pointer.id}>{pointer.label}</span>
        ))}
      </div>
      <div className={`structure-values ${isStack ? "stack-values" : "queue-values"}`}>
        {step.frame.items.length ? (
          step.frame.items.map((item) => (
            <StructureNode item={item} key={item.id} />
          ))
        ) : (
          <div className="empty-state">The structure is empty</div>
        )}
      </div>
      <div className="direction-note">
        {isStack
          ? "Push and pop both use the TOP"
          : "Dequeue leaves at FRONT · Enqueue joins at REAR"}
      </div>
    </div>
  );
}

export function EngineLab() {
  const [demoId, setDemoId] = useState<DemoId>("bubble");
  const demo = useMemo(() => buildDemo(demoId), [demoId]);
  const player = useVisualizationPlayer(demo.timeline);
  const step = player.currentStep;

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "BUTTON") return;
      if (event.code === "Space") {
        event.preventDefault();
        player.state.status === "playing" ? player.pause() : player.play();
      }
      if (event.key === "ArrowRight") player.next();
      if (event.key === "ArrowLeft") player.previous();
      if (event.key.toLowerCase() === "r") player.reset();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [player]);

  const chooseDemo = (id: DemoId) => {
    setDemoId(id);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>AlgoLab</strong><small>Learn by seeing</small></span>
        </div>
        <div className="checkpoint-progress">
          <div><span>Build progress</span><strong>2 / 13</strong></div>
          <div className="progress-track"><span /></div>
        </div>
        <nav aria-label="Curriculum checkpoints">
          <p>Current checkpoint</p>
          <button className="nav-item active"><span>02</span><b>Visualization engine</b></button>
          <p>Coming next</p>
          <div className="nav-item locked"><span>03</span><b>Foundations</b><i>locked</i></div>
          <div className="nav-item locked"><span>04</span><b>Linear structures</b><i>locked</i></div>
          <div className="nav-item locked"><span>05</span><b>Sorting & searching</b><i>locked</i></div>
        </nav>
        <div className="sidebar-tip"><span>✦</span><p><strong>Engine principle</strong><small>One step drives the visual, code, and explanation together.</small></p></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span>Checkpoint 2</span><b>/</b><strong>Reusable engine</strong></div>
          <span className="local-badge"><i />Saved locally</span>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <span className="eyebrow">ENGINE PROOF · 3 VISUAL TYPES</span>
              <h1>One learning engine, many lessons.</h1>
              <p>Switch examples below. The same controls synchronize the visual state, plain-language explanation, and Python code.</p>
            </div>
            <div className="shortcut-hint"><span>⌨</span><p><strong>Keyboard ready</strong><small>Space · ← → · R</small></p></div>
          </section>

          <div className="demo-tabs" role="group" aria-label="Choose an engine demonstration">
            {(["bubble", "stack", "queue"] as DemoId[]).map((id) => {
              const option = buildDemo(id);
              return (
                <button
                  key={id}
                  className={id === demoId ? "demo-tab active" : "demo-tab"}
                  onClick={() => chooseDemo(id)}
                  aria-pressed={id === demoId}
                >
                  <span>{option.shortLabel}</span>
                  <strong>{option.label}</strong>
                </button>
              );
            })}
          </div>

          <section className="lesson-intro">
            <div><span className="lesson-type">{demo.lesson.category === "algorithm" ? "Algorithm" : "Data structure"}</span><h2>{demo.label}</h2><p>{demo.description}</p></div>
            <div className="rule-pill"><small>Core rule</small><strong>{demo.rule}</strong></div>
          </section>

          <section className="learning-grid">
            <article className="visual-card">
              <div className="card-header">
                <div><span className="live-dot" /><strong>Visual playground</strong></div>
                <span>Step {player.state.index < 0 ? 0 : player.state.index + 1} / {demo.timeline.steps.length}</span>
              </div>
              <div className="visual-stage">
                {step.frame.layout === "array" ? <ArrayStage step={step} /> : <StructureStage step={step} />}
              </div>
              <div className="explanation-row"><span>i</span><p><small>What’s happening</small><strong>{step.explanation}</strong></p></div>
              <div className="playback-controls">
                <button onClick={player.reset} aria-label="Reset visualization">↺</button>
                <button onClick={player.previous} disabled={player.state.index < 0} aria-label="Previous step">‹</button>
                <button
                  className="play-button"
                  onClick={player.state.status === "playing" ? player.pause : player.play}
                  aria-label={player.state.status === "playing" ? "Pause" : "Play"}
                >
                  {player.state.status === "playing" ? "Ⅱ" : "▶"}
                </button>
                <button onClick={player.next} disabled={player.state.status === "completed"} aria-label="Next step">›</button>
                <label className="speed-control">
                  <span>Speed <b>{player.state.speed}×</b></span>
                  <input type="range" min="1" max="5" value={player.state.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} />
                </label>
              </div>
              <div className="timeline-progress"><span style={{ width: `${Math.max(0, ((player.state.index + 1) / demo.timeline.steps.length) * 100)}%` }} /></div>
            </article>

            <aside className="code-card">
              <div className="card-header"><div><span className="python-dot">Py</span><strong>Python</strong></div><span>Read-only</span></div>
              <div className="code-lines">
                {demo.lesson.code.map((line, index) => (
                  <div className={index === step.codeLine ? "code-line active" : "code-line"} key={`${index}-${line}`}>
                    <span>{index + 1}</span><code>{line || " "}</code>
                  </div>
                ))}
              </div>
              <div className="event-readout"><span>Current event</span><strong>{step.operation}</strong><small>Frame {player.displayIndex + 1} is immutable</small></div>
            </aside>
          </section>

          <section className="engine-guarantees" aria-label="Engine guarantees">
            <div><span>01</span><p><strong>Deterministic</strong><small>The same input always creates the same lesson steps.</small></p></div>
            <div><span>02</span><p><strong>Rewind-safe</strong><small>Previous steps never change when later steps run.</small></p></div>
            <div><span>03</span><p><strong>Renderer-neutral</strong><small>Arrays, stacks, queues, trees, and graphs share one player.</small></p></div>
          </section>
        </div>
      </section>
    </main>
  );
}
