"use client";

import { useEffect, useReducer } from "react";
import {
  createPlaybackState,
  playbackDelay,
  playbackReducer,
  type VisualizationTimeline,
} from "@/lib/visualization/index.ts";

export function useVisualizationPlayer<TInput extends object>(
  timeline: VisualizationTimeline<TInput>,
) {
  const [state, dispatch] = useReducer(
    playbackReducer,
    createPlaybackState(timeline.steps.length),
  );

  useEffect(() => {
    dispatch({ type: "load", stepCount: timeline.steps.length });
  }, [timeline]);

  useEffect(() => {
    if (state.status !== "playing") return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "tick" });
    }, playbackDelay(state.speed));
    return () => window.clearTimeout(timer);
  }, [state.index, state.speed, state.status]);

  const displayIndex = state.index < 0 ? 0 : state.index;
  const currentStep = timeline.steps[displayIndex];

  return {
    state,
    currentStep,
    displayIndex,
    play: () => dispatch({ type: "play" }),
    pause: () => dispatch({ type: "pause" }),
    next: () => dispatch({ type: "next" }),
    previous: () => dispatch({ type: "previous" }),
    reset: () => dispatch({ type: "reset" }),
    setSpeed: (speed: number) => dispatch({ type: "set-speed", speed }),
  };
}
