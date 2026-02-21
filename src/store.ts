import type { Theme, ThemePreference } from "./types";

const MEDIA = "(prefers-color-scheme: dark)";

interface Config {
  storageKey: string;
  attribute: "class" | `data-${string}`;
  defaultTheme: ThemePreference;
  enableColorScheme: boolean;
  disableTransitionOnChange: boolean;
  forcedTheme?: Theme;
}

const defaults: Config = {
  storageKey: "theme",
  attribute: "class",
  defaultTheme: "system",
  enableColorScheme: true,
  disableTransitionOnChange: false,
};

let cfg: Config = { ...defaults };
let preference: ThemePreference = "system";
let resolved: Theme = "light";
let system: Theme = "light";
let listeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;
let mounted = false;
let refCount = 0;

function getSystemTheme(): Theme {
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

function readStorage(): ThemePreference | null {
  try {
    const val = localStorage.getItem(cfg.storageKey);
    if (val === "light" || val === "dark" || val === "system") return val;
    return null;
  } catch {
    return null;
  }
}

function writeStorage(value: ThemePreference) {
  try {
    localStorage.setItem(cfg.storageKey, value);
  } catch {}
}

function resolve(pref: ThemePreference): Theme {
  return pref === "system" ? system : pref;
}

function applyToDOM(theme: Theme) {
  const d = document.documentElement;

  const restore = cfg.disableTransitionOnChange ? disableTransitions() : null;

  if (cfg.attribute === "class") {
    d.classList.remove("light", "dark");
    d.classList.add(theme);
  } else {
    d.setAttribute(cfg.attribute, theme);
  }

  if (cfg.enableColorScheme) {
    d.style.colorScheme = theme;
  }

  restore?.();
}

function disableTransitions(): () => void {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
    )
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1);
  };
}

function emit() {
  updateSnapshot();
  for (const fn of listeners) fn();
}

function update() {
  resolved = cfg.forcedTheme ?? resolve(preference);
  applyToDOM(resolved);
  emit();
}

function onMediaChange(e: MediaQueryListEvent) {
  system = e.matches ? "dark" : "light";
  if (preference === "system" && !cfg.forcedTheme) {
    resolved = resolve(preference);
    applyToDOM(resolved);
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== cfg.storageKey) return;
  const val = e.newValue;
  if (val === "light" || val === "dark" || val === "system") {
    preference = val;
  } else {
    preference = cfg.defaultTheme;
  }
  update();
}

function attach() {
  if (mounted) return;
  mounted = true;
  system = getSystemTheme();
  mediaQuery = window.matchMedia(MEDIA);
  mediaQuery.addEventListener("change", onMediaChange);
  window.addEventListener("storage", onStorage);
}

function detach() {
  if (!mounted) return;
  mounted = false;
  mediaQuery?.removeEventListener("change", onMediaChange);
  window.removeEventListener("storage", onStorage);
  mediaQuery = null;
}

export function mount(overrides: Partial<Config>): () => void {
  refCount++;
  cfg = { ...defaults, ...overrides };

  if (refCount === 1) {
    attach();
  }

  const stored = readStorage();
  preference = cfg.forcedTheme ? preference : (stored ?? cfg.defaultTheme);
  resolved = cfg.forcedTheme ?? resolve(preference);
  applyToDOM(resolved);
  updateSnapshot();
  emit();

  return () => {
    refCount--;
    if (refCount <= 0) {
      refCount = 0;
      detach();
    }
  };
}

export function configure(overrides: Partial<Config>) {
  cfg = { ...defaults, ...overrides };
  const stored = readStorage();
  preference = cfg.forcedTheme ? preference : (stored ?? cfg.defaultTheme);
  resolved = cfg.forcedTheme ?? resolve(preference);
  applyToDOM(resolved);
  emit();
}

export function setTheme(next: ThemePreference) {
  if (next !== "light" && next !== "dark" && next !== "system") return;
  preference = next;
  writeStorage(next);
  update();
}

export function toggleMode() {
  const next: Theme = resolved === "light" ? "dark" : "light";
  preference = next;
  writeStorage(next);
  update();
}

export function getTheme(): ThemePreference {
  return readStorage() ?? cfg.defaultTheme;
}

let snapshot: { theme: ThemePreference; resolvedTheme: Theme; systemTheme: Theme } = {
  theme: preference,
  resolvedTheme: resolved,
  systemTheme: system,
};

function updateSnapshot() {
  snapshot = { theme: preference, resolvedTheme: resolved, systemTheme: system };
}

export function getSnapshot() {
  return snapshot;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function _reset() {
  detach();
  cfg = { ...defaults };
  preference = "system";
  resolved = "light";
  system = "light";
  listeners.clear();
  mounted = false;
  refCount = 0;
  updateSnapshot();
}
