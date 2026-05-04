"use client";

import { useTransition } from "react";

import { pickCurrentUserAction } from "@/app/actions/partners";
import type { Partners, PersonKey } from "@/lib/db/schema";

export function UserPicker({
  partners,
  authToken,
}: {
  partners: Partners;
  authToken: string;
}) {
  const [pending, startTransition] = useTransition();

  function pick(personKey: PersonKey) {
    const fd = new FormData();
    fd.set("personKey", personKey);
    fd.set("authToken", authToken);
    startTransition(async () => {
      await pickCurrentUserAction(fd);
    });
  }

  const slots: { key: PersonKey; name: string | null }[] = [
    { key: "name1", name: partners.name1 },
    { key: "name2", name: partners.name2 },
    { key: "name3", name: partners.name3 },
    { key: "name4", name: partners.name4 },
  ];

  return (
    <div className="setup-shell">
      <div className="setup-card">
        <h1>who are you?</h1>
        <p>pick yours. you can switch any time.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {slots.map(({ key, name }, i) =>
            name ? (
              <button
                key={key}
                type="button"
                className={i === 0 ? "pill pill-primary" : "pill"}
                onClick={() => pick(key)}
                disabled={pending}
              >
                {name}
              </button>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
