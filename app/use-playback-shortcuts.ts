"use client";

import { useEffect } from "react";

type PlayerControls = {
  state: { status: string };
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
};

export function usePlaybackShortcuts(player: PlayerControls) {
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, button, select, textarea, a, summary, [contenteditable]:not([contenteditable="false"]), [role="radio"], [role="menu"]')) return;
      if (document.querySelector(".course-menu[open]")) return;
      if (!["Space", "ArrowRight", "ArrowLeft", "KeyR"].includes(event.code)) return;
      event.preventDefault();
      if (event.code === "Space") {
        if (player.state.status === "playing") player.pause(); else player.play();
      } else if (event.code === "ArrowRight") player.next();
      else if (event.code === "ArrowLeft") player.previous();
      else player.reset();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [player]);
}
