"use client";

import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme === "dark";
    if (isDark) {
      delete root.dataset.theme;
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    } else {
      root.dataset.theme = "dark";
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle dark mode"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}
