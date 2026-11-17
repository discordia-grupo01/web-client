"use client";

import {
  type DraftSegment,
  type MarkdownRange,
  mentionChipColors,
  messageMarkdownRanges,
  THEMES,
} from "@discordia/client-shared";

import {
  type CSSProperties,
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
import type { EmojiPreview } from "./utils/emojiPreviews";
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
  /** Emojis del servidor del borrador: se dibujan con su imagen al lado. */
  emojiPreviews?: EmojiPreview[];
  onChange: (text: string, cursor: number) => void;
  onCursorMove: (cursor: number) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
}

const SHORTCUTS: Record<string, MarkdownFormat> = { b: "bold", i: "italic" };

/** Lado de la imagen del emoji en el cuadro de texto. */
const EMOJI_PREVIEW_PX = 20;

/**
 * En lugar del `:nombre:` se ve la imagen, como con cualquier otro emoji.
 *
 * El texto no se saca: todo el editor cuenta posiciones sobre texto plano (el
 * cursor, las menciones, los rangos de markdown y lo que se manda al enviar),
 * así que meter un nodo aparte correría todas esas cuentas. Se lo deja donde
 * está y se lo esconde con `font-size: 0`, que lo deja sin ancho; el
 * `inline-block` con medidas es lo que le da caja a la imagen de fondo, porque
 * sin eso un renglón de texto de cero no tiene alto y no se vería nada.
 *
 * Como el texto queda escondido, el cursor nunca puede quedar adentro: las
 * flechas lo saltan entero y una tecla de borrar se lleva el `:nombre:`
 * completo (`moveCaretOutOfEmoji` y `handleEmojiKey`). Si no, al borrar una sola
 * letra lo que queda deja de ser un emoji elegido y reaparece como texto.
 *
 * Dos detalles de CSS que no son opcionales:
 *
 * - El alineado va en palabra clave, no en `em`: `em` se mide contra el
 *   `font-size` del propio elemento, que acá es 0, así que cualquier `-0.3em`
 *   termina valiendo 0. Sin alineado el `inline-block` apoya su *tope* en la
 *   línea de base, o sea que la imagen cuelga entera por debajo del renglón.
 * - `background-size: contain` en lugar de medidas fijas: los emojis no son
 *   todos cuadrados y estirarlos a 20×20 los deforma.
 */
function emojiChipStyle(src: string): CSSProperties {
  return {
    display: "inline-block",
    width: EMOJI_PREVIEW_PX,
    height: EMOJI_PREVIEW_PX,
    verticalAlign: "middle",
    fontSize: 0,
    lineHeight: `${EMOJI_PREVIEW_PX}px`,
    backgroundImage: `url("${src}")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "contain",
  };
}

const STYLE_PROPS: Record<MarkdownRange["style"], Partial<DraftLeaf>> = {
  bold: { bold: true },
  italic: { italic: true },
  underline: { underline: true },
  strike: { strike: true },
  spoiler: { spoiler: true },
  link: { link: true },
  code: { code: true },
  "code-block": { codeBlock: true },
  marker: { marker: true },
  quote: { quote: true },
  "heading-1": { heading: 1 },
  "heading-2": { heading: 2 },
  "heading-3": { heading: 3 },
  subtext: { subtext: true },
};

export const MessageEditor = forwardRef<
  MessageEditorHandle,
  MessageEditorProps
>(function MessageEditor(
  {
    value,
    segments,
    emojiPreviews,
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

  /** El emoji que el cursor está tocando de ese lado, si hay alguno. */
  const emojiBeside = useCallback(
    (offset: number, side: "before" | "after"): EmojiPreview | null =>
      (emojiPreviews ?? []).find((preview) =>
        side === "before"
          ? offset > preview.start && offset <= preview.end
          : offset >= preview.start && offset < preview.end,
      ) ?? null,
    [emojiPreviews],
  );

  /**
   * El `:nombre:` escondido no tiene ancho, así que un clic adentro deja el
   * cursor en un lugar que no se ve. Se lo manda al borde más cercano; como ahí
   * ya no está adentro, el `onChange` que dispara esto no vuelve a entrar.
   */
  function moveCaretOutOfEmoji(cursor: number): boolean {
    if (!editor.selection || !Range.isCollapsed(editor.selection)) return false;
    const inside = (emojiPreviews ?? []).find(
      (preview) => cursor > preview.start && cursor < preview.end,
    );
    if (!inside) return false;
    const edge =
      cursor - inside.start <= inside.end - cursor ? inside.start : inside.end;
    Transforms.select(editor, offsetToPoint(editor, edge));
    return true;
  }

  function handleChange(nodes: Descendant[]) {
    const cursor = editor.selection
      ? pointToOffset(editor, Range.start(editor.selection))
      : 0;
    const text = valueToText(nodes);
    if (text === lastText.current) {
      if (moveCaretOutOfEmoji(cursor)) return;
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

  /**
   * El emoji se mueve y se borra como si fuera un solo carácter. Devuelve
   * `true` si la tecla era suya (hay que cortar ahí).
   */
  function handleEmojiKey(event: KeyboardEvent<HTMLDivElement>): boolean {
    const isArrow = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const isDelete = event.key === "Backspace" || event.key === "Delete";
    if (!isArrow && !isDelete) return false;
    // Con Shift se está seleccionando, y con los modificadores son atajos.
    if (isArrow && event.shiftKey) return false;
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    if (!editor.selection || !Range.isCollapsed(editor.selection)) return false;

    const backwards = event.key === "ArrowLeft" || event.key === "Backspace";
    const cursor = pointToOffset(editor, Range.start(editor.selection));
    const emoji = emojiBeside(cursor, backwards ? "before" : "after");
    if (!emoji) return false;

    event.preventDefault();
    if (isDelete) {
      Transforms.delete(editor, {
        at: {
          anchor: offsetToPoint(editor, emoji.start),
          focus: offsetToPoint(editor, emoji.end),
        },
      });
    } else {
      Transforms.select(
        editor,
        offsetToPoint(editor, backwards ? emoji.start : emoji.end),
      );
    }
    return true;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const format = SHORTCUTS[event.key.toLowerCase()];
    if (format && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      applyFormat(format);
      return;
    }
    if (handleEmojiKey(event)) return;
    onKeyDown?.(event);
  }

  const ranges = useMemo(() => {
    const colors = THEMES[theme];
    const roleColorOf = (id: string) =>
      sources?.roles.find((role) => role.id.toLowerCase() === id.toLowerCase())
        ?.color;

    const markdown = messageMarkdownRanges(value);
    const all: { start: number; end: number; props: Partial<DraftLeaf> }[] =
      markdown.map((range) => ({
        start: range.start,
        end: range.end,
        props: STYLE_PROPS[range.style],
      }));
    const quoteStarts = new Set(
      markdown
        .filter((range) => range.style === "quote")
        .map((range) => range.start),
    );

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

    for (const preview of emojiPreviews ?? []) {
      all.push({
        start: preview.start,
        end: preview.end,
        props: { emojiStyle: emojiChipStyle(preview.src) },
      });
    }
    return { all, quoteStarts };
  }, [value, segments, emojiPreviews, theme, sources]);

  const decorate = useCallback(
    ([node, path]: NodeEntry): Range[] => {
      if (!Text.isText(node) || path.length !== 2) return [];
      const lineStart = lineStarts(editor)[path[0]] ?? 0;
      const lineEnd = lineStart + node.text.length;
      const decorations: Range[] = [];
      for (const range of ranges.all) {
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

  const renderElement = useCallback(
    ({ attributes, children, element }: RenderElementProps) => {
      const line = ReactEditor.findPath(editor, element)[0];
      const quoted = ranges.quoteStarts.has(lineStarts(editor)[line] ?? -1);
      return (
        <div
          {...attributes}
          className={cn(quoted && "border-line-strong border-l-4 pl-2")}
        >
          {children}
        </div>
      );
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
          // El renglón ya reserva el alto del emoji, así que la caja no salta
          // al insertar uno.
          "max-h-[200px] leading-[22px] overflow-y-auto break-words whitespace-pre-wrap",
          className,
        )}
      />
    </Slate>
  );
});

function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  return (
    <span
      {...attributes}
      style={leaf.emojiStyle ?? leaf.mentionStyle}
      className={cn(
        leaf.bold && "font-bold",
        leaf.italic && "italic",
        leaf.underline && "underline",
        leaf.strike && "line-through",
        leaf.underline &&
          leaf.strike &&
          "[text-decoration-line:underline_line-through]",
        leaf.spoiler && "bg-content-subtle/40 rounded",
        leaf.link && "text-sky",
        (leaf.code || leaf.codeBlock) &&
          "bg-surface-sunken font-mono text-[0.9em]",
        leaf.heading === 1 && "font-display text-xl font-bold",
        leaf.heading === 2 && "font-display text-lg font-bold",
        leaf.heading === 3 && "font-display text-base font-bold",
        leaf.subtext && "text-content-subtle text-xs",
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
