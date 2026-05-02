"use client";

import { useRef, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  deleteCardAction,
  updateCardAction,
} from "@/app/actions/cards";
import { todayISO } from "@/lib/date";
import type { Card } from "@/lib/db/schema";

export function EditMenu({
  card,
  onEdit,
  inset = false,
}: {
  card: Card;
  /** Omit to hide the edit button (delete still shown). */
  onEdit?: () => void;
  /** True for cards that have padding:0 themselves (image card). */
  inset?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const qc = useQueryClient();
  const slotRef = useRef<HTMLDivElement>(null);

  const ANIM_MS = 280;

  function remove() {
    const shell = slotRef.current?.closest(".card-shell");
    if (shell) shell.setAttribute("data-deleting", "");

    const fd = new FormData();
    fd.set("id", card.id);
    fd.set("clientToday", todayISO());
    startTransition(async () => {
      await Promise.all([
        deleteCardAction(fd),
        new Promise((r) => setTimeout(r, ANIM_MS)),
      ]);
      qc.invalidateQueries({ queryKey: ["canvas"] });
    });
  }

  return (
    <div
      ref={slotRef}
      className={`edit-slot${inset ? " edit-slot-inset" : ""}`}
      data-open={confirming || undefined}
    >
      <div className="edit-buttons" data-confirming={confirming || undefined}>
        {onEdit && (
          <button
            key="edit"
            type="button"
            className="pill pill-ghost pill-bouncy"
            onClick={onEdit}
            disabled={pending}
          >
            edit
          </button>
        )}
        {confirming ? (
          <>
            <button
              key="confirm"
              type="button"
              className="pill pill-primary pill-bouncy pill-confirm-action"
              onClick={remove}
              disabled={pending}
            >
              confirm delete
            </button>
            <button
              key="cancel"
              type="button"
              className="pill pill-ghost pill-bouncy pill-confirm-action"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              cancel
            </button>
          </>
        ) : (
          <button
            key="delete"
            type="button"
            className="pill pill-ghost pill-bouncy pill-confirm-action"
            onClick={() => setConfirming(true)}
            disabled={pending}
          >
            delete
          </button>
        )}
      </div>
    </div>
  );
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return async function update(formData: FormData): Promise<void> {
    formData.set("clientToday", todayISO());
    await updateCardAction(formData);
    qc.invalidateQueries({ queryKey: ["canvas"] });
  };
}
