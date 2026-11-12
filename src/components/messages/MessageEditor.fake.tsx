import {
  type ComponentProps,
  forwardRef,
  type KeyboardEvent,
  useImperativeHandle,
  useRef,
} from "react";

import type {
  MessageEditor as RealMessageEditor,
  MessageEditorHandle,
} from "./MessageEditor";

type Props = ComponentProps<typeof RealMessageEditor>;

export const MessageEditor = forwardRef<MessageEditorHandle, Props>(
  function FakeMessageEditor(
    {
      value,
      segments,
      onChange,
      onCursorMove,
      onKeyDown,
      disabled,
      readOnly,
      autoFocus,
      placeholder,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const textarea = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => ({
      focus: () => textarea.current?.focus(),
      setCursor: (offset) => {
        textarea.current?.focus();
        textarea.current?.setSelectionRange(offset, offset);
      },
    }));

    return (
      <>
        <textarea
          {...(props as ComponentProps<"textarea">)}
          ref={textarea}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          className={className}
          style={style}
          onChange={(event) =>
            onChange(event.target.value, event.target.selectionStart)
          }
          onSelect={(event) => onCursorMove(event.currentTarget.selectionStart)}
          onKeyDown={(event) =>
            onKeyDown?.(event as unknown as KeyboardEvent<HTMLDivElement>)
          }
        />
        <ul data-testid="draft-mentions">
          {segments
            ?.filter((segment) => segment.kind !== "text")
            .map((segment, index) => (
              <li key={index}>{segment.value}</li>
            ))}
        </ul>
      </>
    );
  },
);
