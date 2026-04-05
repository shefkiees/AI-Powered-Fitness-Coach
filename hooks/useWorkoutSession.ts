"use client";

import { useCallback, useEffect, useReducer } from "react";

export type WorkoutPhase = "idle" | "work" | "rest" | "done";

export type WorkoutSessionConfig = {
  workSeconds: number;
  restSeconds: number;
  totalSets: number;
};

type State = {
  phase: WorkoutPhase;
  currentSet: number;
  remaining: number;
  running: boolean;
};

type Action =
  | { type: "START"; workSeconds: number }
  | { type: "PAUSE" }
  | { type: "RESET"; workSeconds: number }
  | { type: "TICK"; workSeconds: number; restSeconds: number; totalSets: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return {
        phase: "idle",
        currentSet: 1,
        remaining: action.workSeconds,
        running: false,
      };
    case "START": {
      const ws = action.workSeconds;
      if (state.phase === "done" || state.phase === "idle") {
        return {
          phase: "work",
          currentSet: 1,
          remaining: ws,
          running: true,
        };
      }
      return { ...state, running: true };
    }
    case "PAUSE":
      return { ...state, running: false };
    case "TICK": {
      if (!state.running || state.phase === "idle" || state.phase === "done") {
        return state;
      }
      const { workSeconds, restSeconds, totalSets } = action;
      if (state.remaining > 1) {
        return { ...state, remaining: state.remaining - 1 };
      }
      if (state.phase === "work") {
        if (state.currentSet >= totalSets) {
          return {
            ...state,
            phase: "done",
            running: false,
            remaining: 0,
          };
        }
        return {
          ...state,
          phase: "rest",
          remaining: restSeconds,
        };
      }
      if (state.phase === "rest") {
        return {
          ...state,
          phase: "work",
          currentSet: state.currentSet + 1,
          remaining: workSeconds,
        };
      }
      return state;
    }
    default:
      return state;
  }
}

export function useWorkoutSession(config: WorkoutSessionConfig) {
  const { workSeconds, restSeconds, totalSets } = config;
  const [state, dispatch] = useReducer(reducer, {
    phase: "idle" as WorkoutPhase,
    currentSet: 1,
    remaining: workSeconds,
    running: false,
  });

  useEffect(() => {
    if (!state.running || state.phase === "idle" || state.phase === "done") {
      return;
    }
    const id = setInterval(() => {
      dispatch({
        type: "TICK",
        workSeconds,
        restSeconds,
        totalSets,
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.running, state.phase, workSeconds, restSeconds, totalSets]);

  const start = useCallback(() => {
    dispatch({
      type: "START",
      workSeconds,
    });
  }, [workSeconds]);

  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);

  const reset = useCallback(() => {
    dispatch({
      type: "RESET",
      workSeconds,
    });
  }, [workSeconds]);

  const workProg =
    state.phase === "work" && workSeconds > 0
      ? (workSeconds - state.remaining) / workSeconds
      : 0;
  const restProg =
    state.phase === "rest" && restSeconds > 0
      ? (restSeconds - state.remaining) / restSeconds
      : 0;

  const phaseProgress =
    state.phase === "work"
      ? Math.min(1, Math.max(0, workProg))
      : state.phase === "rest"
        ? Math.min(1, Math.max(0, restProg))
        : 0;

  let overallProgress = 0;
  if (state.phase === "done") overallProgress = 100;
  else if (totalSets > 0) {
    if (state.phase === "rest") {
      overallProgress = (state.currentSet / totalSets) * 100;
    } else if (state.phase === "work") {
      overallProgress =
        ((state.currentSet - 1 + phaseProgress) / totalSets) * 100;
    }
  }

  return {
    phase: state.phase,
    currentSet: state.currentSet,
    totalSets,
    remaining: state.remaining,
    running: state.running,
    phaseProgress: Math.min(1, Math.max(0, phaseProgress)),
    overallProgress: Math.min(100, Math.max(0, overallProgress)),
    start,
    pause,
    reset,
  };
}
