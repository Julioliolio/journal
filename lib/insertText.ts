// Insert text into a named <textarea>/<input> field within a form, at the
// current selection (or end if none), then re-trigger auto-grow + React's
// onChange listeners. Used by the felt section's emoji picker so a picked
// emoji lands in the textarea instead of being dropped on the floor.
export function insertIntoNamedField(
  form: HTMLFormElement | null,
  name: string,
  text: string,
): void {
  if (!form || !text) return;
  const field = form.elements.namedItem(name);
  if (
    !(field instanceof HTMLTextAreaElement) &&
    !(field instanceof HTMLInputElement)
  )
    return;
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;
  const next = field.value.slice(0, start) + text + field.value.slice(end);

  // Use the native value setter so React's synthetic onChange fires.
  const proto =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(field, next);

  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.focus();
  const caret = start + text.length;
  field.setSelectionRange(caret, caret);
}
