"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import { createReflectionAction } from "@/app/actions/cards";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";
import { invalidateCanvas } from "@/lib/queries";

import { FeltImagePicker } from "./FeltImagePicker";

export function ReflectionForm({
  today,
  onDone,
}: {
  today: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feltImageUrl, setFeltImageUrl] = useState<string | null>(null);
  const [feltFile, setFeltFile] = useState<File | null>(null);
  const { saved, flash } = useSubmitMorph();
  const qc = useQueryClient();
  const haptic = useWebHaptics();
  const busy = pending || saved;

  return (
    <form
      className="compose compose-dark"
      action={(fd) => {
        fd.set("date", today);
        fd.set("clientToday", today);
        if (feltFile) fd.set("feltImageFile", feltFile);
        else if (feltImageUrl) fd.set("feltImageUrl", feltImageUrl);
        // Sync inside the gesture handler — iOS Safari and Firefox
        // Android drop haptics that land after an await.
        haptic.trigger("medium");
        startTransition(async () => {
          try {
            await createReflectionAction(fd);
            await Promise.all([flash(), invalidateCanvas(qc)]);
            onDone();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed.");
          }
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) {
          event.preventDefault();
          onDone();
        }
      }}
    >
      <Field name="did" label="did" />
      <Field name="learned" label="learned" />
      <Field name="felt" label="felt">
        <FeltImagePicker
          url={feltImageUrl}
          onChange={(url, file) => { setFeltImageUrl(url); setFeltFile(file ?? null); }}
          disabled={busy}
        />
      </Field>
      {error && <p className="compose-error">{error}</p>}
      <div className="compose-footer">
        <span className="compose-spacer" />
        <button
          type="button"
          className="pill pill-ghost"
          onClick={onDone}
          disabled={busy}
        >
          cancel
        </button>
        <button
          type="submit"
          className="pill pill-primary pill-bouncy"
          data-saved={saved || undefined}
          data-pending={pending || undefined}
          disabled={busy}
        >
          {saved ? "✓" : pending ? "saving" : "save"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="compose-row"
      style={{ flexDirection: "column", alignItems: "stretch" }}
    >
      <span className="reflection-label">{label}</span>
      <AutoGrowTextarea
        name={name}
        className="compose-textarea"
        placeholder="…"
        minRows={1}
      />
      {children}
    </div>
  );
}
