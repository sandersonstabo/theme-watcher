import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, renderHook, act } from "@testing-library/react";
import { ThemeWatcher, useTheme } from "../src";
import { _reset } from "../src/store";

const MEDIA = "(prefers-color-scheme: dark)";

function mockMedia(dark: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();

  const mql: MediaQueryList = {
    matches: dark,
    media: MEDIA,
    onchange: null,
    addEventListener: vi.fn((_: string, fn: EventListenerOrEventListenerObject) => {
      listeners.add(fn as (e: MediaQueryListEvent) => void);
    }),
    removeEventListener: vi.fn((_: string, fn: EventListenerOrEventListenerObject) => {
      listeners.delete(fn as (e: MediaQueryListEvent) => void);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  vi.stubGlobal("matchMedia", vi.fn(() => mql));

  return {
    mql,
    toggle(next: boolean) {
      (mql as { matches: boolean }).matches = next;
      for (const fn of listeners) fn({ matches: next } as MediaQueryListEvent);
    },
  };
}

const html = () => document.documentElement;

describe("ThemeWatcher", () => {
  beforeEach(() => {
    html().className = "";
    html().removeAttribute("data-theme");
    html().style.cssText = "";
    localStorage.clear();
    _reset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("applies dark class when system prefers dark", () => {
    mockMedia(true);
    render(<ThemeWatcher />);
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("applies light class when system prefers light", () => {
    mockMedia(false);
    render(<ThemeWatcher />);
    expect(html().classList.contains("light")).toBe(true);
  });

  it("sets color-scheme on html", () => {
    mockMedia(true);
    render(<ThemeWatcher />);
    expect(html().style.colorScheme).toBe("dark");
  });

  it("does not set color-scheme when disabled", () => {
    mockMedia(true);
    render(<ThemeWatcher enableColorScheme={false} />);
    expect(html().style.colorScheme).toBe("");
  });

  it("uses forced theme prop over everything", () => {
    mockMedia(false);
    localStorage.setItem("theme", "light");
    render(<ThemeWatcher theme="dark" />);
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("reads stored preference from localStorage", () => {
    mockMedia(false);
    localStorage.setItem("theme", "dark");
    render(<ThemeWatcher />);
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("ignores invalid localStorage values", () => {
    mockMedia(false);
    localStorage.setItem("theme", "purple");
    render(<ThemeWatcher defaultTheme="light" />);
    expect(html().classList.contains("light")).toBe(true);
  });

  it("supports data-theme attribute mode", () => {
    mockMedia(true);
    render(<ThemeWatcher attribute="data-theme" />);
    expect(html().getAttribute("data-theme")).toBe("dark");
    expect(html().classList.contains("dark")).toBe(false);
  });

  it("reacts to system theme changes when preference is system", () => {
    const media = mockMedia(false);
    render(<ThemeWatcher />);
    expect(html().classList.contains("light")).toBe(true);

    media.toggle(true);
    expect(html().classList.contains("dark")).toBe(true);
    expect(html().classList.contains("light")).toBe(false);
  });

  it("does not react to system changes when user chose explicit theme", () => {
    const media = mockMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("dark"));
    expect(html().classList.contains("dark")).toBe(true);

    media.toggle(true);
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("syncs across tabs via storage event", () => {
    mockMedia(false);
    render(<ThemeWatcher />);
    expect(html().classList.contains("light")).toBe(true);

    localStorage.setItem("theme", "dark");
    window.dispatchEvent(new StorageEvent("storage", {
      key: "theme",
      newValue: "dark",
      storageArea: localStorage,
    }));
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("avoids duplicate listeners on multiple mounts", () => {
    const media = mockMedia(false);
    render(<><ThemeWatcher /><ThemeWatcher /></>);
    expect(media.mql.addEventListener).toHaveBeenCalledTimes(1);
  });
});

describe("useTheme", () => {
  beforeEach(() => {
    html().className = "";
    html().style.cssText = "";
    localStorage.clear();
    _reset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("setTheme persists and applies", () => {
    mockMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("dark"));
    expect(html().classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(result.current.theme).toBe("dark");
  });

  it("set is an alias for setTheme", () => {
    mockMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.set("dark"));
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("get returns stored preference", () => {
    mockMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    expect(result.current.get()).toBe("system");
    act(() => result.current.set("dark"));
    expect(result.current.get()).toBe("dark");
  });

  it("exposes systemTheme regardless of preference", () => {
    const media = mockMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    expect(result.current.systemTheme).toBe("light");

    act(() => media.toggle(true));
    expect(result.current.systemTheme).toBe("dark");
  });

  it("resolvedTheme reflects forced theme", () => {
    mockMedia(false);
    render(<ThemeWatcher theme="dark" />);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("dark");
  });

  describe("toggleMode", () => {
    it("toggles from light to dark", () => {
      mockMedia(false);
      render(<ThemeWatcher />);
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe("light");
      act(() => result.current.toggleMode());
      expect(result.current.resolvedTheme).toBe("dark");
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("toggles from dark to light", () => {
      mockMedia(true);
      render(<ThemeWatcher />);
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe("dark");
      act(() => result.current.toggleMode());
      expect(result.current.resolvedTheme).toBe("light");
      expect(localStorage.getItem("theme")).toBe("light");
    });

    it("toggles when system preference changes", () => {
      const media = mockMedia(false);
      render(<ThemeWatcher />);
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBe("light");
      act(() => media.toggle(true));
      expect(result.current.resolvedTheme).toBe("dark");
      act(() => result.current.toggleMode());
      expect(result.current.resolvedTheme).toBe("light");
    });
  });
});
