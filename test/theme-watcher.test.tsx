import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, renderHook } from "@testing-library/react";
import { ThemeWatcher, useTheme } from "../src";
import { resetStoreForTests } from "../src/theme-store";

function mockMatchMedia(initialDark: boolean) {
  let isDark = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const listenerMap = new Map<
    EventListenerOrEventListenerObject,
    (event: MediaQueryListEvent) => void
  >();

  const toHandler = (listener: EventListenerOrEventListenerObject) => {
    const existing = listenerMap.get(listener);
    if (existing) return existing;

    let handler: (event: MediaQueryListEvent) => void;
    if (typeof listener === "function") {
      handler = listener as (event: MediaQueryListEvent) => void;
    } else {
      handler = (event: MediaQueryListEvent) => listener.handleEvent(event);
    }
    listenerMap.set(listener, handler);
    return handler;
  };

  const mql = {
    matches: isDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(toHandler(listener));
    }),
    removeEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(toHandler(listener));
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  } satisfies MediaQueryList;

  vi.stubGlobal("matchMedia", vi.fn(() => mql));

  return {
    mql,
    setDarkMode(next: boolean) {
      isDark = next;
      mql.matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    }
  };
}

describe("theme-watcher", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.style.removeProperty("--background");
    document.documentElement.style.removeProperty("--foreground");
    document.documentElement.style.removeProperty("color-scheme");
    localStorage.clear();
    resetStoreForTests();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("applies system preference by default", () => {
    mockMatchMedia(true);
    render(<ThemeWatcher />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("supports controlled theme prop override", () => {
    mockMatchMedia(false);
    render(<ThemeWatcher theme="dark" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("set/get updates and persists preference", () => {
    mockMatchMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    result.current.set("dark");
    expect(result.current.get()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme-watcher")).toBe("dark");
  });

  it("ignores invalid stored values and falls back to default", () => {
    mockMatchMedia(false);
    localStorage.setItem("theme-watcher", "blue");
    render(<ThemeWatcher defaultTheme="light" />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("updates when system preference changes if theme is system", () => {
    const media = mockMatchMedia(false);
    render(<ThemeWatcher defaultTheme="system" />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    media.setDarkMode(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("does not override explicit user theme on system changes", () => {
    const media = mockMatchMedia(false);
    render(<ThemeWatcher />);
    const { result } = renderHook(() => useTheme());

    result.current.set("dark");
    media.setDarkMode(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("syncs theme updates through storage events", () => {
    mockMatchMedia(false);
    render(<ThemeWatcher />);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "theme-watcher",
        newValue: "dark",
        storageArea: localStorage
      })
    );
    localStorage.setItem("theme-watcher", "dark");

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "theme-watcher",
        newValue: "dark",
        storageArea: localStorage
      })
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("supports class attribute mode", () => {
    mockMatchMedia(true);
    render(<ThemeWatcher attribute="class" />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("applies css variables for the active theme", () => {
    mockMatchMedia(true);
    render(
      <ThemeWatcher
        variables={{
          light: { "--background": "#ffffff", "--foreground": "#111111" },
          dark: { "--background": "#111111", "--foreground": "#ffffff" }
        }}
      />
    );

    expect(document.documentElement.style.getPropertyValue("--background")).toBe("#111111");
    expect(document.documentElement.style.getPropertyValue("--foreground")).toBe("#ffffff");
  });

  it("updates css variables when mode changes", () => {
    mockMatchMedia(false);
    render(
      <ThemeWatcher
        variables={{
          light: { "--background": "#ffffff" },
          dark: { "--background": "#111111" }
        }}
      />
    );
    const { result } = renderHook(() => useTheme());

    expect(document.documentElement.style.getPropertyValue("--background")).toBe("#ffffff");
    result.current.set("dark");
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("#111111");
  });

  it("sets color-scheme by default and can disable it", () => {
    mockMatchMedia(true);
    const first = render(<ThemeWatcher />);
    expect(document.documentElement.style.getPropertyValue("color-scheme")).toBe("dark");
    first.unmount();

    render(<ThemeWatcher enableColorScheme={false} />);
    expect(document.documentElement.style.getPropertyValue("color-scheme")).toBe("");
  });

  it("avoids duplicate media listeners across multiple mounts", () => {
    const media = mockMatchMedia(false);
    render(
      <>
        <ThemeWatcher />
        <ThemeWatcher />
      </>
    );

    expect(media.mql.addEventListener).toHaveBeenCalledTimes(1);
  });
});
