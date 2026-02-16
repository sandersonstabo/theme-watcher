import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeWatcher, useTheme } from "../../../src";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card";
import { Button } from "./components/ui/button";
import "./globals.css";

function ThemeToggle() {
  const { resolvedTheme, setTheme, get, systemTheme } = useTheme();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>theme-watcher</CardTitle>
        <CardDescription>
          Visual test with real shadcn components and Tailwind v4.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          Resolved: <span className="font-semibold">{resolvedTheme}</span>
        </p>
        <p>
          Preference: <span className="font-semibold">{get()}</span>
        </p>
        <p>
          System: <span className="font-semibold">{systemTheme}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          Toggle
        </Button>
        <Button variant="outline" onClick={() => setTheme("system")}>
          System
        </Button>
      </CardFooter>
    </Card>
  );
}

function App() {
  return (
    <>
      <ThemeWatcher />
      <div className="flex min-h-screen items-center justify-center">
        <ThemeToggle />
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
