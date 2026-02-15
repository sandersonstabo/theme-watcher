> [!IMPORTANT]
> This program was written by GPT-5.3 Codex.

# theme-watcher

Plug-and-play theme syncing for React SPAs.

## Install

```bash
npm i theme-watcher
```

## Quick start

```tsx
import { useTheme, ThemeWatcher } from "theme-watcher";

function App() {
  const { set, get } = useTheme();

  return (
    <>
      <ThemeWatcher />
      <button onClick={() => set("dark")}>Dark</button>
      <pre>{get()}</pre>
    </>
  );
}
```

## API

### `<ThemeWatcher />`

Mount once near your app root.

Props:
- `theme?: "light" | "dark"` controlled override
- `storageKey?: string` default: `"theme-watcher"`
- `attribute?: "data-theme" | "class"` default: `"data-theme"`
- `defaultTheme?: "light" | "dark" | "system"` default: `"system"`

### `useTheme()`

Returns:
- `theme` stored preference (`"light" | "dark" | "system"`)
- `resolvedTheme` active applied theme (`"light" | "dark"`)
- `source` where the current value came from (`"prop" | "storage" | "default" | "system"`)
- `set(theme)` set and persist preference
- `get()` get persisted preference

## Behavior notes

- Priority order: `theme prop` -> `localStorage` -> `defaultTheme` -> system theme.
- `system` mode updates live when `prefers-color-scheme` changes.
- Cross-tab updates are synced through `storage` events.
- Package is ESM-only.

## Development

This repo uses Bun for package management and scripts, but the published package has no Bun runtime dependency.

```bash
bun install
bun run typecheck
bun run test
bun run build
```
