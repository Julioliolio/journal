"use client";

import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
};

function resize(node: HTMLTextAreaElement) {
  node.style.height = "auto";
  node.style.height = `${node.scrollHeight}px`;
}

export function AutoGrowTextarea({ minRows = 2, onInput, ...rest }: Props) {
  return (
    <textarea
      ref={(node) => {
        if (node) resize(node);
      }}
      rows={minRows}
      onInput={(event) => {
        resize(event.currentTarget);
        onInput?.(event);
      }}
      {...rest}
    />
  );
}
