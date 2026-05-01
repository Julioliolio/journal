"use client";

import {
  useEffect,
  useRef,
  type TextareaHTMLAttributes,
} from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
};

function resize(node: HTMLTextAreaElement) {
  node.style.height = "auto";
  node.style.height = `${node.scrollHeight}px`;
}

export function AutoGrowTextarea({ minRows = 2, onInput, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, []);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      onInput={(event) => {
        resize(event.currentTarget);
        onInput?.(event);
      }}
      {...rest}
    />
  );
}
