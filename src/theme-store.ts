import type {
  Theme,
  ThemeAttribute,
  ThemePreference,
  ThemeSource,
  ThemeState,
  ThemeVariables
} from "./types";

interface StoreConfig {
  storageKey: string;
  attribute: ThemeAttribute;
  defaultTheme: ThemePreference;
  variables?: ThemeVariables;
  enableColorScheme: boolean;
}

const DEFAULT_CONFIG: StoreConfig = {
  storageKey: "theme-watcher",
  attribute: "both",
  defaultTheme: "system",
  enableColorScheme: true
};

const VALID_PREFERENCES = new Set<ThemePreference>(["light", "dark", "system"]);

let config: StoreConfig = { ...DEFAULT_CONFIG };
let controlledTheme: Theme | undefined;
let state: ThemeState = {
  theme: "system",
  resolvedTheme: "light",
  source: "system"
};
let subscribers = new Set<() => void>();
let mediaQueryList: MediaQueryList | null = null;
let initialized = false;
let watcherCount = 0;

function isBrowserReady() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readStoredTheme(): ThemePreference | null {
  if (!isBrowserReady()) return null;
  try {
    const value = window.localStorage.getItem(config.storageKey);
    if (!value || !VALID_PREFERENCES.has(value as ThemePreference)) {
      return null;
    }
    return value as ThemePreference;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: ThemePreference) {
  if (!isBrowserReady()) return;
  try {
    window.localStorage.setItem(config.storageKey, theme);
  } catch {
    return;
  }
}

function resolveSystemTheme(): Theme {
  if (!isBrowserReady()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(
  propTheme: Theme | undefined,
  stored: ThemePreference | null,
  defaultTheme: ThemePreference
): ThemeState {
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

  const source: ThemeSource = stored ? "storage" : "default";
  return { theme: effective, resolvedTheme: effective, source };
}

function applyDomTheme(resolvedTheme: Theme) {
  if (!isBrowserReady()) return;
  const root = document.documentElement;

  if (config.attribute === "class" || config.attribute === "both") {
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.remove("light");
  }

  if (config.attribute === "class") {
    return;
  }

  root.setAttribute("data-theme", resolvedTheme);
}

function applyThemeVariables(resolvedTheme: Theme) {
  if (!isBrowserReady()) return;
  const root = document.documentElement;
  const lightVars = config.variables?.light ?? {};
  const darkVars = config.variables?.dark ?? {};
  const allKeys = new Set([...Object.keys(lightVars), ...Object.keys(darkVars)]);

  for (const key of allKeys) {
    root.style.removeProperty(key);
  }

  const nextVars = config.variables?.[resolvedTheme];
  if (!nextVars) return;

  for (const [key, value] of Object.entries(nextVars)) {
    root.style.setProperty(key, value);
  }
}

function applyColorScheme(resolvedTheme: Theme) {
  if (!isBrowserReady()) return;
  if (!config.enableColorScheme) {
    document.documentElement.style.removeProperty("color-scheme");
    return;
  }
  document.documentElement.style.setProperty("color-scheme", resolvedTheme);
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
  applyThemeVariables(state.resolvedTheme);
  applyColorScheme(state.resolvedTheme);
  emit();
}

function handleMediaChange() {
  if (controlledTheme || state.theme !== "system") return;
  recompute();
}

function handleStorage(event: StorageEvent) {
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

export function configureStore(nextConfig: Partial<StoreConfig>, propTheme?: Theme) {
  config = {
    ...config,
    ...nextConfig
  };
  controlledTheme = propTheme;
  recompute();
}

export function mountWatcher(nextConfig: Partial<StoreConfig>, propTheme?: Theme) {
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
      controlledTheme = undefined;
      detachListeners();
    }
  };
}

export function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function setTheme(theme: ThemePreference) {
  if (!VALID_PREFERENCES.has(theme)) return;
  writeStoredTheme(theme);
  state = resolveTheme(controlledTheme, theme, config.defaultTheme);
  applyDomTheme(state.resolvedTheme);
  applyThemeVariables(state.resolvedTheme);
  applyColorScheme(state.resolvedTheme);
  emit();
}

export function getTheme(): ThemePreference {
  return readStoredTheme() ?? config.defaultTheme;
}

export function getState(): ThemeState {
  return state;
}

export function getServerSnapshot(): ThemeState {
  return {
    theme: config.defaultTheme,
    resolvedTheme: config.defaultTheme === "dark" ? "dark" : "light",
    source: "default"
  };
}

export function resetStoreForTests() {
  subscribers.clear();
  detachListeners();
  config = { ...DEFAULT_CONFIG };
  controlledTheme = undefined;
  initialized = false;
  watcherCount = 0;
  state = {
    theme: "system",
    resolvedTheme: "light",
    source: "system"
  };
}
