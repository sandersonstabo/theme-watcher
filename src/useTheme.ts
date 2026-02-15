import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getState,
  getTheme,
  setTheme,
  subscribe
} from "./theme-store";
import type { ThemeApi } from "./types";

export function useTheme(): ThemeApi {
  const state = useSyncExternalStore(subscribe, getState, getServerSnapshot);

  return {
    ...state,
    set: setTheme,
    setTheme,
    get: getTheme
  };
}
