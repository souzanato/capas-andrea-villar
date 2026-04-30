import { useState, useCallback } from "react";

const MAX_HISTORY = 20;

interface HistoryState<T> {
  history: T[];
  cursor: number;
}

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<HistoryState<T>>({
    history: initialState ? [initialState] : [],
    cursor: 0,
  });

  const current = state.history[state.cursor];

  const push = useCallback((next: T) => {
    setState((prev) => {
      const trimmed = prev.history.slice(0, prev.cursor + 1);
      const updated = [...trimmed, next];
      const capped =
        updated.length > MAX_HISTORY
          ? updated.slice(updated.length - MAX_HISTORY)
          : updated;
      return {
        history: capped,
        cursor: capped.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      cursor: Math.max(prev.cursor - 1, 0),
    }));
  }, []);

  const redo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      cursor: Math.min(prev.cursor + 1, prev.history.length - 1),
    }));
  }, []);

  const canUndo = state.cursor > 0;
  const canRedo = state.cursor < state.history.length - 1;

  return { current, push, undo, redo, canUndo, canRedo };
}
