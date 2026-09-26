"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { curriculumModules } from "@/lib/curriculum.ts";

export function CourseMenu({ currentPath }: { currentPath: string }) {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target) && menu.current) menu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, []);

  const destinations = [
    { href: "/curriculum", title: "Course map", description: "Progress and all modules", mark: "⌂" },
    { href: "/practice", title: "Practice Lab", description: "Questions across every module", mark: "✓" },
    ...curriculumModules.map((course) => ({ href: course.href, title: course.title, description: `${course.lessonCount} interactive lessons`, mark: course.checkpoint })),
  ];

  return (
    <details className="course-menu" ref={menu} onKeyDown={(event) => {
      // Preserve native summary/link behavior without starting lesson playback.
      event.stopPropagation();
      if (event.key === "Escape" && menu.current?.open) {
        event.preventDefault();
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label="Open course menu"><span className="course-menu-grid" aria-hidden="true"><i /><i /><i /><i /></span><b>Courses</b><em aria-hidden="true">⌄</em></summary>
      <div className="course-menu-popover">
        <header><span>JUMP ANYWHERE</span><strong>Select a course</strong><small>You do not need to follow the checkpoints in order.</small></header>
        <nav aria-label="All AlgoLab courses">
          {destinations.map((destination) => <Link key={destination.href} className={currentPath === destination.href ? "active" : ""} aria-current={currentPath === destination.href ? "page" : undefined} href={destination.href} onClick={() => { if (menu.current) menu.current.open = false; }}>
            <span>{destination.mark}</span><div><strong>{destination.title}</strong><small>{destination.description}</small></div>{currentPath === destination.href && <i>current</i>}
          </Link>)}
        </nav>
      </div>
    </details>
  );
}
