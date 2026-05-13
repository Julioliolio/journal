"use client";

import { LeafIcon } from "./icons";

export function CastToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const isOn = root.dataset.cast === "on";
    if (isOn) {
      delete root.dataset.cast;
      try {
        localStorage.setItem("cast", "off");
      } catch {}
    } else {
      root.dataset.cast = "on";
      try {
        localStorage.setItem("cast", "on");
      } catch {}
    }
  };

  return (
    <button
      type="button"
      className="cast-toggle"
      onClick={toggle}
      aria-label="Toggle leaf shadow"
    >
      <LeafIcon />
    </button>
  );
}
