> [!IMPORTANT]
> This package was authored by Opus 4.6.

# theme-watcher

Plug-and-play dark mode for React SPAs. Works with Tailwind, shadcn, and any CSS that styles on `class="dark"` or `data-theme`.

## Install

```bash
npm i theme-watcher
```

## Quick start

```tsx
import { ThemeWatcher, useTheme } from "theme-watcher";

function App() {
  return (
    <>
      <ThemeWatcher />
      <ThemeToggle />
    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      Toggle
    </button>
  );
}
```

That's it. By default it follows system preference, persists the choice to `localStorage`, syncs across tabs, and sets `class="dark"` + `color-scheme` on `<html>`.

## With Tailwind / shadcn

Set `darkMode: "class"` (or `"selector"`) in your Tailwind config. No other setup needed; `<ThemeWatcher />` toggles the `dark` class that Tailwind looks for.

Style your tokens in CSS:

```css
:root {
  --background: #ffffff;
  --foreground: #111111;
}

.dark {
  --background: #111111;
  --foreground: #ffffff;
}
```

## API

### `<ThemeWatcher />`

Drop once near your app root. Renders nothing.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `"light" \| "dark"` | - | Force a specific theme (overrides everything) |
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | Initial theme when nothing is stored |
| `storageKey` | `string` | `"theme"` | localStorage key |
| `attribute` | `"class" \| \`data-\${string}\`` | `"class"` | HTML attribute to set on `<html>` |
| `enableColorScheme` | `boolean` | `true` | Set `color-scheme` on `<html>` for native UI |
| `disableTransitionOnChange` | `boolean` | `false` | Kill CSS transitions during theme switch |

### `useTheme()`

| Return | Type | Description |
|--------|------|-------------|
| `theme` | `"light" \| "dark" \| "system"` | Current preference |
| `resolvedTheme` | `"light" \| "dark"` | Actual applied theme |
| `systemTheme` | `"light" \| "dark"` | What the OS reports |
| `setTheme(t)` | `(t: ThemePreference) => void` | Set and persist |
| `set(t)` | `(t: ThemePreference) => void` | Alias for `setTheme` |
| `get()` | `() => ThemePreference` | Read stored preference |

## How it works

1. On mount, reads localStorage (or falls back to `defaultTheme`).
2. If preference is `"system"`, resolves via `prefers-color-scheme` media query.
3. Applies resolved theme to `<html>` (class toggle or data attribute) and sets `color-scheme`.
4. Listens to OS preference changes and `storage` events for cross-tab sync.
5. `setTheme()` writes to localStorage, updates DOM, and notifies all `useTheme()` consumers.

## Development

Uses Bun for dev tooling only. The published package has zero runtime dependencies beyond React.

```bash
bun install
bun run typecheck
bun run test
bun run build
```
