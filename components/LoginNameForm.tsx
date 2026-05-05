"use client";

import { useState, useTransition } from "react";

type Action = (fd: FormData) => Promise<unknown> | unknown;

type Mode = "setup" | "join";

export function LoginNameForm({
  mode,
  knownNames,
  authToken,
  action,
  defaultPrompt,
  subtitle,
  submitLabel,
  pendingLabel,
}: {
  mode: Mode;
  knownNames?: string[];
  authToken: string;
  action: Action;
  defaultPrompt: string;
  subtitle: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const trimmed = name.trim();
  const headingText =
    trimmed.length > 0
      ? `hi, ${trimmed}`
      : mode === "join" && knownNames && knownNames.length > 0
        ? `join ${formatNames(knownNames)}`
        : defaultPrompt;

  return (
    <main className="login-shell">
      <div className="login-card">
        <h1>
          <span className="login-stamp" aria-hidden />
          <span key={headingText} className="login-greet">
            {headingText}
          </span>
        </h1>
        <p>{subtitle}</p>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              try {
                await action(fd);
                setSaved(true);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Couldn’t continue.",
                );
              }
            });
          }}
        >
          <input type="hidden" name="authToken" value={authToken} />
          <div className="login-field">
            <label htmlFor="name">your name</label>
            <input
              id="name"
              name="name"
              required
              maxLength={40}
              autoFocus
              autoComplete="off"
              disabled={pending || saved}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && <p className="compose-error">{error}</p>}
          <div className="login-actions">
            <button
              type="submit"
              className="pill pill-primary pill-bouncy"
              disabled={pending || saved || trimmed.length === 0}
              data-saved={saved ? "true" : undefined}
            >
              {saved ? "" : pending ? pendingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function formatNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}
