"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type TextareaHTMLAttributes,
} from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
};

export const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, Props>(
  function AutoGrowTextarea({ minRows = 2, onInput, ...rest }, ref) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current!, []);

    function resize(node: HTMLTextAreaElement) {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    }

    useEffect(() => {
      if (innerRef.current) resize(innerRef.current);
    }, []);

    return (
      <textarea
        ref={innerRef}
        rows={minRows}
        onInput={(event) => {
          resize(event.currentTarget);
          onInput?.(event);
        }}
        {...rest}
      />
    );
  },
);
