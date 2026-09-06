export type PlaybackStatus = "idle" | "playing" | "paused" | "completed";

export type PlaybackState = Readonly<{
  status: PlaybackStatus;
  index: number;
  stepCount: number;
  speed: number;
}>;

export type PlaybackAction =
  | Readonly<{ type: "load"; stepCount: number }>
  | Readonly<{ type: "play" }>
  | Readonly<{ type: "pause" }>
  | Readonly<{ type: "tick" }>
  | Readonly<{ type: "next" }>
  | Readonly<{ type: "previous" }>
  | Readonly<{ type: "reset" }>
  | Readonly<{ type: "set-speed"; speed: number }>;

export function clampSpeed(speed: number): number {
  return Math.max(1, Math.min(5, Math.round(speed)));
}

export function createPlaybackState(
  stepCount: number,
  speed = 3,
): PlaybackState {
  return Object.freeze({
    status: "idle",
    index: -1,
    stepCount: Math.max(0, stepCount),
    speed: clampSpeed(speed),
  });
}

function advance(
  state: PlaybackState,
  manual: boolean,
): PlaybackState {
  if (state.stepCount === 0) {
    return Object.freeze({ ...state, status: "completed", index: -1 });
  }

  const nextIndex = Math.min(state.index + 1, state.stepCount - 1);
  const atEnd = nextIndex === state.stepCount - 1;
  return Object.freeze({
    ...state,
    index: nextIndex,
    status: atEnd ? "completed" : manual ? "paused" : "playing",
  });
}

export function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "load":
      return createPlaybackState(action.stepCount, state.speed);
    case "play":
      if (state.stepCount === 0) return state;
      return Object.freeze({
        ...state,
        index: state.status === "completed" ? -1 : state.index,
        status: "playing",
      });
    case "pause":
      return state.status === "playing"
        ? Object.freeze({ ...state, status: "paused" })
        : state;
    case "tick":
      return advance(state, false);
    case "next":
      return advance(state, true);
    case "previous": {
      const index = Math.max(-1, state.index - 1);
      return Object.freeze({
        ...state,
        index,
        status: index === -1 ? "idle" : "paused",
      });
    }
    case "reset":
      return createPlaybackState(state.stepCount, state.speed);
    case "set-speed":
      return Object.freeze({ ...state, speed: clampSpeed(action.speed) });
    default:
      return state;
  }
}

export function playbackDelay(speed: number): number {
  return 1200 - clampSpeed(speed) * 180;
}
