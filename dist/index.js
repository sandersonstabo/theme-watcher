// src/ThemeWatcher.tsx
import { useEffect } from "react";

// src/theme-store.ts
var DEFAULT_CONFIG = {
  storageKey: "theme-watcher",
  attribute: "data-theme",
  defaultTheme: "system"
};
var VALID_PREFERENCES = /* @__PURE__ */ new Set(["light", "dark", "system"]);
var config = { ...DEFAULT_CONFIG };
var controlledTheme;
var state = {
  theme: "system",
  resolvedTheme: "light",
  source: "system"
};
var subscribers = /* @__PURE__ */ new Set();
var mediaQueryList = null;
var initialized = false;
var watcherCount = 0;
function isBrowserReady() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function readStoredTheme() {
  if (!isBrowserReady()) return null;
  try {
    const value = window.localStorage.getItem(config.storageKey);
    if (!value || !VALID_PREFERENCES.has(value)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}
function writeStoredTheme(theme) {
  if (!isBrowserReady()) return;
  try {
    window.localStorage.setItem(config.storageKey, theme);
  } catch {
    return;
  }
}
function resolveSystemTheme() {
  if (!isBrowserReady()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function resolveTheme(propTheme, stored, defaultTheme) {
  if (propTheme) {
    return { theme: propTheme, resolvedTheme: propTheme, source: "prop" };
  }
  const effective = stored ?? defaultTheme;
  if (effective === "system") {
    return {
      theme: "system",
      resolvedTheme: resolveSystemTheme(),
      source: stored ? "storage" : defaultTheme === "system" ? "system" : "default"
    };
  }
  const source = stored ? "storage" : "default";
  return { theme: effective, resolvedTheme: effective, source };
}
function applyDomTheme(resolvedTheme) {
  if (!isBrowserReady()) return;
  const root = document.documentElement;
  if (config.attribute === "class") {
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    return;
  }
  root.setAttribute("data-theme", resolvedTheme);
}
function emit() {
  for (const callback of subscribers) {
    callback();
  }
}
function recompute() {
  const stored = readStoredTheme();
  state = resolveTheme(controlledTheme, stored, config.defaultTheme);
  applyDomTheme(state.resolvedTheme);
  emit();
}
function handleMediaChange() {
  if (controlledTheme || state.theme !== "system") return;
  recompute();
}
function handleStorage(event) {
  if (event.key !== config.storageKey) return;
  recompute();
}
function attachListeners() {
  if (!isBrowserReady() || mediaQueryList) return;
  mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQueryList.addEventListener("change", handleMediaChange);
  window.addEventListener("storage", handleStorage);
}
function detachListeners() {
  if (!isBrowserReady() || !mediaQueryList) return;
  mediaQueryList.removeEventListener("change", handleMediaChange);
  window.removeEventListener("storage", handleStorage);
  mediaQueryList = null;
}
function configureStore(nextConfig, propTheme) {
  config = {
    ...config,
    ...nextConfig
  };
  controlledTheme = propTheme;
  recompute();
}
function mountWatcher(nextConfig, propTheme) {
  watcherCount += 1;
  if (!initialized) {
    initialized = true;
    attachListeners();
  }
  configureStore(nextConfig, propTheme);
  return () => {
    watcherCount -= 1;
    if (watcherCount <= 0) {
      watcherCount = 0;
      controlledTheme = void 0;
      detachListeners();
    }
  };
}
function subscribe(callback) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}
function setTheme(theme) {
  if (!VALID_PREFERENCES.has(theme)) return;
  writeStoredTheme(theme);
  state = resolveTheme(controlledTheme, theme, config.defaultTheme);
  applyDomTheme(state.resolvedTheme);
  emit();
}
function getTheme() {
  return readStoredTheme() ?? config.defaultTheme;
}
function getState() {
  return state;
}
function getServerSnapshot() {
  return {
    theme: config.defaultTheme,
    resolvedTheme: config.defaultTheme === "dark" ? "dark" : "light",
    source: "default"
  };
}

// src/ThemeWatcher.tsx
function ThemeWatcher({
  theme,
  storageKey = "theme-watcher",
  attribute = "data-theme",
  defaultTheme = "system"
}) {
  useEffect(() => {
    return mountWatcher({ storageKey, attribute, defaultTheme }, theme);
  }, [theme, storageKey, attribute, defaultTheme]);
  return null;
}

// src/useTheme.ts
import { useSyncExternalStore } from "react";
function useTheme() {
  const state2 = useSyncExternalStore(subscribe, getState, getServerSnapshot);
  return {
    ...state2,
    set: setTheme,
    get: getTheme
  };
}
export {
  ThemeWatcher,
  useTheme
};
