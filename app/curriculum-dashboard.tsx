"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { countStoredLessons, curriculumModules, curriculumProgress, totalCurriculumLessons } from "@/lib/curriculum.ts";
import { CourseMenu } from "./course-menu";
import { ProgressBadge } from "./progress-badge";
import { readLocalValue } from "@/lib/local-progress.ts";

const emptyProgress = Object.fromEntries(curriculumModules.map((module) => [module.id, 0]));

export function CurriculumDashboard() {
  const [progress, setProgress] = useState<Record<string, number>>(emptyProgress);

  useEffect(() => {
    const readProgress = () => {
      const next = Object.fromEntries(curriculumModules.map((module) => [module.id, countStoredLessons(readLocalValue(module.storageKey), module.lessonCount, module.lessonIds)]));
      queueMicrotask(() => setProgress(next));
    };
    readProgress();
    window.addEventListener("storage", readProgress);
    return () => window.removeEventListener("storage", readProgress);
  }, []);

  const summary = useMemo(() => curriculumProgress(progress), [progress]);
  const allComplete = summary.completedLessons === totalCurriculumLessons;

  return <main className="app-shell curriculum-shell"><aside className="sidebar curriculum-sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>AlgoLab</strong><small>Learn by seeing</small></span></div><div className="checkpoint-progress curriculum-side-progress"><div><span>Course progress</span><strong>{summary.percentage}%</strong></div><div className="progress-track"><span style={{ width: `${summary.percentage}%` }} /></div><small>{summary.completedLessons} of {totalCurriculumLessons} lessons explored</small></div><nav aria-label="Curriculum modules"><p>Course map</p>{curriculumModules.map((module) => { const count = progress[module.id] ?? 0; const complete = count === module.lessonCount; return <a className="nav-item curriculum-nav-item" href={`#module-${module.id}`} key={module.id}><span>{module.checkpoint}</span><b>{module.title}</b><i>{complete ? "✓" : `${count}/${module.lessonCount}`}</i></a>; })}<p>Check your recall</p><Link className="nav-section-link" href="/practice"><span>12</span><b>Practice Lab</b></Link></nav><div className="sidebar-tip"><span>✦</span><p><strong>Your progress stays here</strong><small>Completion is stored only in this browser on this device.</small></p></div></aside>
    <section className="workspace"><header className="topbar"><div><span>Checkpoint 11</span><b>/</b><strong>Course map & review</strong></div><div className="topbar-actions"><CourseMenu currentPath="/curriculum" /><ProgressBadge label="Local learning profile" /></div></header><div className="page-content curriculum-content">
      <section className="curriculum-hero"><div className="curriculum-hero-copy"><span className="eyebrow">THE COMPLETE LEARNING PATH · 8 MODULES</span><h1>{allComplete ? "You explored the full core curriculum." : "See the whole path. Continue from where you stopped."}</h1><p>Move from memory and basic structures to trees, graphs, and reusable problem-solving strategies. Every module includes editable examples, visual steps, Python, and practical usage guidance.</p><div className="curriculum-actions"><Link className="curriculum-primary-action" href={summary.resumeModule.href}>{allComplete ? "Review algorithmic techniques" : `Continue ${summary.resumeModule.title}`} <span>→</span></Link><Link className="curriculum-secondary-action" href="/practice">Open Practice Lab</Link></div></div><div className="curriculum-ring" style={{ "--course-progress": `${summary.percentage * 3.6}deg` } as React.CSSProperties}><div><strong>{summary.percentage}%</strong><span>explored</span></div></div></section>
      <section className="curriculum-stats" aria-label="Course totals"><div><strong>8</strong><span>learning modules</span></div><div><strong>{totalCurriculumLessons}</strong><span>interactive lessons</span></div><div><strong>{summary.completedModules}</strong><span>modules explored</span></div><div><strong>Python</strong><span>first language</span></div></section>
      <section className="curriculum-section"><div className="curriculum-section-heading"><span>YOUR ROADMAP</span><h2>Learn in sequence or jump to what you need</h2><p>The order builds vocabulary first, then structures, algorithms, networks, and finally general strategies.</p></div><div className="curriculum-module-list">{curriculumModules.map((module, index) => { const count = progress[module.id] ?? 0; const percentage = Math.round((count / module.lessonCount) * 100); const status = count === module.lessonCount ? "complete" : count > 0 ? "active" : "ready"; return <article className={`curriculum-module-card status-${status}`} id={`module-${module.id}`} key={module.id}><div className="curriculum-module-number"><span>{String(index + 1).padStart(2, "0")}</span><i /></div><div className="curriculum-module-body"><div className="curriculum-module-title"><div><small>CHECKPOINT {module.checkpoint}</small><h3>{module.title}</h3></div><span>{status === "complete" ? "Explored ✓" : status === "active" ? "In progress" : "Ready"}</span></div><p>{module.description}</p><div className="curriculum-topics">{module.topics.map((topic) => <span key={topic}>{topic}</span>)}</div><div className="curriculum-card-progress"><div><span style={{ width: `${percentage}%` }} /></div><small>{count} / {module.lessonCount} lessons</small></div></div><Link href={module.href} aria-label={`${status === "complete" ? "Review" : count ? "Continue" : "Open"} ${module.title}`}>{status === "complete" ? "Review" : count ? "Continue" : "Open"}<span>→</span></Link></article>; })}</div></section>
      <section className="curriculum-connections"><div className="curriculum-section-heading"><span>HOW IT CONNECTS</span><h2>Three layers of algorithmic thinking</h2></div><div className="curriculum-connection-grid"><article><span>01</span><h3>Read the data</h3><p>Foundations make indices, memory shape, recursion, and growth visible.</p><small>Foundations</small></article><article><span>02</span><h3>Choose a structure</h3><p>Lists, trees, heaps, and graphs determine which operations are natural.</p><small>Linear structures · Trees · Graphs</small></article><article><span>03</span><h3>Choose an approach</h3><p>Search, sort, shortest paths, greedy choices, and DP solve the actual problem.</p><small>Algorithms · Weighted graphs · Techniques</small></article></div></section>
      <section className="curriculum-next-step"><div><span>{allComplete ? "CURRICULUM EXPLORED" : "RECOMMENDED NEXT STEP"}</span><h2>{allComplete ? "Revisit a lesson with your own input." : summary.resumeModule.title}</h2><p>{allComplete ? "Real understanding grows when you predict a step first, then use the visualizer to check your reasoning." : `You have explored ${progress[summary.resumeModule.id] ?? 0} of ${summary.resumeModule.lessonCount} lessons in this module.`}</p></div><Link href={summary.resumeModule.href}>{allComplete ? "Start a review" : "Continue learning"}<span>→</span></Link></section>
    </div></section></main>;
}
