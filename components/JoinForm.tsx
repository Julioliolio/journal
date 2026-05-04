"use client";

import { useState, useTransition } from "react";

import { joinAsPartnerAction } from "@/app/actions/partners";

export function JoinForm({
  knownNames,
  authToken,
}: {
  knownNames: string[];
  authToken: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="setup-shell">
      <div className="setup-card">
        <h1>join {formatNames(knownNames)}</h1>
        <p>pick your name. you’ll be able to switch any time.</p>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              try {
                await joinAsPartnerAction(fd);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Couldn’t join.",
                );
              }
            });
          }}
        >
          <input type="hidden" name="authToken" value={authToken} />
          <div className="setup-field">
            <label htmlFor="name">your name</label>
            <input
              id="name"
              name="name"
              required
              maxLength={40}
              autoFocus
              autoComplete="off"
              disabled={pending}
            />
          </div>
          {error && <p className="compose-error">{error}</p>}
          <div className="setup-actions">
            <button
              type="submit"
              className="pill pill-primary"
              disabled={pending}
            >
              {pending ? "joining…" : "join"}
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
