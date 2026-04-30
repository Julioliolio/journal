"use client";

import { useState, useTransition } from "react";

import { joinAsPartnerAction } from "@/app/actions/partners";

export function JoinForm({
  creatorName,
  authToken,
}: {
  creatorName: string;
  authToken: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="setup-shell">
      <div className="setup-card">
        <h1>join {creatorName}</h1>
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
          <div
            className="compose-footer"
            style={{ marginTop: 16, justifyContent: "flex-end" }}
          >
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
