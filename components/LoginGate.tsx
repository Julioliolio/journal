"use client";

import { useState, useTransition } from "react";

import {
  joinAsPartnerAction,
  pickCurrentUserAction,
} from "@/app/actions/partners";
import type { Partners, PersonKey } from "@/lib/db/schema";

type Action = (fd: FormData) => Promise<unknown> | unknown;

export function LoginGate({
  partners,
  authToken,
  joinAction,
  pickAction,
}: {
  partners: Partners;
  authToken: string;
  // Optional override hooks — used by the demo so it can no-op without
  // routing through the real server actions.
  joinAction?: Action;
  pickAction?: Action;
}) {
  const join = joinAction ?? joinAsPartnerAction;
  const pick = pickAction ?? pickCurrentUserAction;

  const [name, setName] = useState("");
  const [pickPending, startPickTransition] = useTransition();
  const [joinPending, startJoinTransition] = useTransition();
  const [chosen, setChosen] = useState<PersonKey | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots: { key: PersonKey; name: string | null }[] = [
    { key: "name1", name: partners.name1 },
    { key: "name2", name: partners.name2 },
    { key: "name3", name: partners.name3 },
    { key: "name4", name: partners.name4 },
  ];
  const filled = slots.filter((s): s is { key: PersonKey; name: string } =>
    Boolean(s.name),
  );
  const slotAvailable =
    !partners.name2 || !partners.name3 || !partners.name4;

  const trimmed = name.trim();
  const chosenName = chosen ? filled.find((s) => s.key === chosen)?.name : null;
  const headingText = chosenName
    ? `welcome back, ${chosenName}`
    : trimmed.length > 0
      ? `hi, ${trimmed}`
      : "who are you?";

  const busy = pickPending || joinPending || chosen !== null || joined;

  function pickSlot(key: PersonKey) {
    if (busy) return;
    setError(null);
    setChosen(key);
    const fd = new FormData();
    fd.set("personKey", key);
    fd.set("authToken", authToken);
    setTimeout(() => {
      startPickTransition(async () => {
        try {
          await pick(fd);
        } catch (err) {
          setChosen(null);
          setError(err instanceof Error ? err.message : "Couldn’t pick.");
        }
      });
    }, 300);
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <h1>
          <span className="login-stamp" aria-hidden />
          <span key={headingText} className="login-greet">
            {headingText}
          </span>
        </h1>
        <p>
          {slotAvailable
            ? "pick yours, or add a new name."
            : "pick yours. you can switch any time."}
        </p>

        <div className="login-picker" data-chosen={chosen ?? undefined}>
          {filled.map(({ key, name: n }) => (
            <button
              key={key}
              type="button"
              className="pill pill-bouncy"
              onClick={() => pickSlot(key)}
              disabled={busy && chosen !== key}
              data-chosen={chosen === key ? "true" : undefined}
            >
              {n}
            </button>
          ))}
        </div>

        {slotAvailable && (
          <>
            <div className="login-divider" aria-hidden>
              <span>or add yourself</span>
            </div>
            <form
              action={(fd) => {
                if (busy) return;
                setError(null);
                startJoinTransition(async () => {
                  try {
                    await join(fd);
                    setJoined(true);
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Couldn’t join.",
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
                  autoComplete="off"
                  disabled={busy}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {error && <p className="compose-error">{error}</p>}
              <div className="login-actions">
                <button
                  type="submit"
                  className="pill pill-primary pill-bouncy"
                  disabled={busy || trimmed.length === 0}
                  data-saved={joined ? "true" : undefined}
                >
                  {joined ? "" : joinPending ? "joining…" : "join"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
