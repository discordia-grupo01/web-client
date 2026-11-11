"use client";

import {
  type DraftSegment,
  type MarkdownRange,
  mentionChipColors,
  messageMarkdownRanges,
  THEMES,
} from "@discordia/client-shared";

import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createEditor,
  type Descendant,
  Editor,
  type NodeEntry,
  Range,
  Text,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
  Slate,
  withReact,
} from "slate-react";

import { useMessageMentions } from "@/contexts/MentionsContext";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import type { DraftLeaf } from "@/types/slate.types";

import { FormatToolbar } from "./FormatToolbar";
import {
  lineStarts,
  offsetToPoint,
  pointToOffset,
  textToValue,
  valueToText,
} from "./utils/editorText";
import {
  type MarkdownFormat,
  toggleMarkdownFormat,
} from "./utils/markdownFormat";

export interface MessageEditorHandle {
  focus: () => void;
  setCursor: (offset: number) => void;
}

type EditableAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "onKeyDown" | "placeholder" | "children"
>;

interface MessageEditorProps extends EditableAttributes {
  value: string;
  segments: DraftSegment[] | null;
  onChange: (text: string, cursor: number) => void;
  onCursorMove: (cursor: number) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
}

const SHORTCUTS: Record<string, MarkdownFormat> = { b: "bold", i: "italic" };

const STYLE_PROPS: Record<MarkdownRange["style"], Partial<DraftLeaf>> = {
  bold: { bold: true },
  italic: { italic: true },
  strike: { strike: true },
  code: { code: true },
  "code-block": { codeBlock: true },
  marker: { marker: true },
  quote: { quote: true },
  "heading-1": { heading: 1 },
  "heading-2": { heading: 2 },
  "heading-3": { heading: 3 },
};

export const MessageEditor = forwardRef<
  MessageEditorHandle,
  MessageEditorProps
>(function MessageEditor(
  {
    value,
    segments,
    onChange,
    onCursorMove,
    onKeyDown,
    placeholder,
    disabled = false,
    readOnly = false,
    autoFocus = false,
    className,
    ...props
  },
  ref,
) {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [initialValue] = useState(() => textToValue(value));
  const lastText = useRef(value);
  const { theme } = useTheme();
  const { sources } = useMessageMentions();

  useImperativeHandle(
    ref,
    () => ({
      focus: () => ReactEditor.focus(editor),
      setCursor: (offset) => {
        Transforms.select(editor, offsetToPoint(editor, offset));
        ReactEditor.focus(editor);
      },
    }),
    [editor],
  );

  // El borrador cambio desde afuera (se eligio una mencion, se agrego un
  // emoji o se vacio al enviar): el editor pasa a mostrar ese texto.
  useLayoutEffect(() => {
    if (value === valueToText(editor.children)) return;
    lastText.current = value;
    Editor.withoutNormalizing(editor, () => {
      editor.children = textToValue(value);
    });
    editor.history = { undos: [], redos: [] };
    editor.selection = null;
    Transforms.select(editor, Editor.end(editor, []));
    editor.onChange();
  }, [value, editor]);

  function handleChange(nodes: Descendant[]) {
    const cursor = editor.selection
      ? pointToOffset(editor, Range.start(editor.selection))
      : 0;
    const text = valueToText(nodes);
    if (text === lastText.current) {
      onCursorMove(cursor);
      return;
    }
    lastText.current = text;
    onChange(text, cursor);
  }

  const applyFormat = useCallback(
    (format: MarkdownFormat) => {
      if (!editor.selection) return;
      const [anchor, focus] = Range.edges(editor.selection);
      const change = toggleMarkdownFormat(
        valueToText(editor.children),
        pointToOffset(editor, anchor),
        pointToOffset(editor, focus),
        format,
      );
      Editor.withoutNormalizing(editor, () => {
        for (const edit of change.edits) {
          const at = offsetToPoint(editor, edit.start);
          if (edit.end > edit.start) {
            Transforms.delete(editor, {
              at: { anchor: at, focus: offsetToPoint(editor, edit.end) },
            });
          }
          if (edit.insert) Transforms.insertText(editor, edit.insert, { at });
        }
      });
      Transforms.select(editor, {
        anchor: offsetToPoint(editor, change.selection.start),
        focus: offsetToPoint(editor, change.selection.end),
      });
      ReactEditor.focus(editor);
    },
    [editor],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const format = SHORTCUTS[event.key.toLowerCase()];
    if (format && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      applyFormat(format);
      return;
    }
    onKeyDown?.(event);
  }

  const ranges = useMemo(() => {
    const colors = THEMES[theme];
    const roleColorOf = (id: string) =>
      sources?.roles.find((role) => role.id.toLowerCase() === id.toLowerCase())
        ?.color;

    const all: { start: number; end: number; props: Partial<DraftLeaf> }[] =
      messageMarkdownRanges(value).map((range) => ({
        start: range.start,
        end: range.end,
        props: STYLE_PROPS[range.style],
      }));

    let offset = 0;
    for (const segment of segments ?? []) {
      const chip = mentionChipColors(
        segment.kind,
        colors,
        segment.kind === "role" ? roleColorOf(segment.id) : null,
      );
      if (chip) {
        all.push({
          start: offset,
          end: offset + segment.value.length,
          props: { mentionStyle: chip },
        });
      }
      offset += segment.value.length;
    }
    return all;
  }, [value, segments, theme, sources]);

  const decorate = useCallback(
    ([node, path]: NodeEntry): Range[] => {
      if (!Text.isText(node) || path.length !== 2) return [];
      const lineStart = lineStarts(editor)[path[0]] ?? 0;
      const lineEnd = lineStart + node.text.length;
      const decorations: Range[] = [];
      for (const range of ranges) {
        const start = Math.max(range.start, lineStart);
        const end = Math.min(range.end, lineEnd);
        if (end <= start) continue;
        decorations.push({
          anchor: { path, offset: start - lineStart },
          focus: { path, offset: end - lineStart },
          ...range.props,
        });
      }
      return decorations;
    },
    [editor, ranges],
  );

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
      <FormatToolbar onFormat={applyFormat} />
      <Editable
        {...props}
        decorate={decorate}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        renderPlaceholder={renderPlaceholder}
        placeholder={placeholder}
        readOnly={disabled || readOnly}
        aria-disabled={disabled || undefined}
        autoFocus={autoFocus}
        onKeyDown={handleKeyDown}
        className={cn(
          "max-h-[200px] overflow-y-auto break-words whitespace-pre-wrap",
          className,
        )}
      />
    </Slate>
  );
});

function renderElement({ attributes, children, element }: RenderElementProps) {
  const quoted = /^>( |$)/.test(element.children.map((c) => c.text).join(""));
  return (
    <div
      {...attributes}
      className={cn(quoted && "border-line-strong border-l-4 pl-2")}
    >
      {children}
    </div>
  );
}

function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  return (
    <span
      {...attributes}
      style={leaf.mentionStyle}
      className={cn(
        leaf.bold && "font-bold",
        leaf.italic && "italic",
        leaf.strike && "line-through",
        (leaf.code || leaf.codeBlock) &&
          "bg-surface-sunken font-mono text-[0.9em]",
        leaf.heading === 1 && "font-display text-xl font-bold",
        leaf.heading === 2 && "font-display text-lg font-bold",
        leaf.heading === 3 && "font-display text-base font-bold",
        leaf.marker && "text-content-subtle",
      )}
    >
      {children}
    </span>
  );
}

function renderPlaceholder({ attributes, children }: RenderPlaceholderProps) {
  return (
    <span
      {...attributes}
      style={{ ...attributes.style, top: undefined, opacity: 1 }}
      className="text-content-subtle truncate"
    >
      {children}
    </span>
  );
}
