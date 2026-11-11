"use client";

import {
  Bold,
  Code,
  Italic,
  type LucideIcon,
  Quote,
  Strikethrough,
} from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Editor, Range } from "slate";
import { ReactEditor, useFocused, useSlate } from "slate-react";

import type { MarkdownFormat } from "./utils/markdownFormat";

const BUTTONS: { format: MarkdownFormat; label: string; icon: LucideIcon }[] = [
  { format: "bold", label: "Negrita", icon: Bold },
  { format: "italic", label: "Cursiva", icon: Italic },
  { format: "strike", label: "Tachado", icon: Strikethrough },
  { format: "quote", label: "Cita", icon: Quote },
  { format: "code", label: "Código", icon: Code },
];

const GAP = 8;

interface FormatToolbarProps {
  onFormat: (format: MarkdownFormat) => void;
}

export function FormatToolbar({ onFormat }: FormatToolbarProps) {
  const editor = useSlate();
  const focused = useFocused();
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const { selection } = editor;
  const visible =
    focused &&
    selection !== null &&
    !Range.isCollapsed(selection) &&
    Editor.string(editor, selection) !== "";

  useLayoutEffect(() => {
    if (!visible || !selection) {
      setPosition(null);
      return;
    }
    try {
      const rect = ReactEditor.toDOMRange(
        editor,
        selection,
      ).getBoundingClientRect();
      setPosition({ top: rect.top - GAP, left: rect.left + rect.width / 2 });
    } catch {
      setPosition(null);
    }
  }, [visible, selection, editor]);

  if (!visible || !position) return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="Formato de texto"
      className="bg-surface-modal border-line fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-md border p-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {BUTTONS.map(({ format, label, icon: Icon }) => (
        <button
          key={format}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => onFormat(format)}
          className="text-content-muted hover:bg-surface-hover hover:text-content flex size-8 cursor-pointer items-center justify-center rounded"
        >
          <Icon size={16} />
        </button>
      ))}
    </div>,
    document.body,
  );
}
