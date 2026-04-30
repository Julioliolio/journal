"use client";

import { useTransition } from "react";

import { pickCurrentUserAction } from "@/app/actions/partners";
import type { Partners } from "@/lib/db/schema";

export function UserPicker({
  partners,
  authToken,
}: {
  partners: Partners;
  authToken: string;
}) {
  const [pending, startTransition] = useTransition();

  function pick(personKey: "name1" | "name2") {
    const fd = new FormData();
    fd.set("personKey", personKey);
    fd.set("authToken", authToken);
    startTransition(async () => {
      await pickCurrentUserAction(fd);
    });
  }

  return (
    <div className="setup-shell">
      <div className="setup-card">
        <h1>who are you?</h1>
        <p>pick yours. you can switch any time.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="pill pill-primary"
            onClick={() => pick("name1")}
            disabled={pending}
          >
            {partners.name1}
          </button>
          {partners.name2 && (
            <button
              type="button"
              className="pill"
              onClick={() => pick("name2")}
              disabled={pending}
            >
              {partners.name2}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
