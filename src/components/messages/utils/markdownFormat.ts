export interface TextEdit {
  start: number;
  end: number;
  insert: string;
}

export interface FormatChange {
  edits: TextEdit[];
  selection: { start: number; end: number };
}

export type MarkdownFormat = "bold" | "italic" | "strike" | "code" | "quote";

const WRAPS: Record<Exclude<MarkdownFormat, "quote">, string> = {
  bold: "**",
  italic: "*",
  strike: "~~",
  code: "`",
};

const CODE_BLOCK = { open: "```\n", close: "\n```" };
const QUOTE_PREFIX = "> ";

export function toggleMarkdownFormat(
  text: string,
  start: number,
  end: number,
  format: MarkdownFormat,
): FormatChange {
  if (format === "quote") return toggleQuote(text, start, end);
  if (format === "code" && text.slice(start, end).includes("\n")) {
    return toggleWrap(text, start, end, CODE_BLOCK.open, CODE_BLOCK.close);
  }
  const marker = WRAPS[format];
  return toggleWrap(text, start, end, marker, marker);
}

function toggleWrap(
  text: string,
  start: number,
  end: number,
  open: string,
  close: string,
): FormatChange {
  const before = text.slice(0, start);
  const after = text.slice(end);
  if (hasMarkerBefore(before, open) && hasMarkerAfter(after, close)) {
    return {
      edits: [
        { start: end, end: end + close.length, insert: "" },
        { start: start - open.length, end: start, insert: "" },
      ],
      selection: { start: start - open.length, end: end - open.length },
    };
  }

  const selected = text.slice(start, end);
  if (
    selected.length >= open.length + close.length &&
    hasMarkerAfter(selected, open) &&
    hasMarkerBefore(selected, close)
  ) {
    return {
      edits: [
        { start: end - close.length, end, insert: "" },
        { start, end: start + open.length, insert: "" },
      ],
      selection: { start, end: end - open.length - close.length },
    };
  }

  return {
    edits: [
      { start: end, end, insert: close },
      { start, end: start, insert: open },
    ],
    selection: { start: start + open.length, end: end + open.length },
  };
}

function hasMarkerBefore(text: string, marker: string): boolean {
  if (!text.endsWith(marker)) return false;
  if (marker !== "*") return true;
  return runAtEnd(text, "*") !== 2;
}

function hasMarkerAfter(text: string, marker: string): boolean {
  if (!text.startsWith(marker)) return false;
  if (marker !== "*") return true;
  return runAtStart(text, "*") !== 2;
}

function runAtEnd(text: string, char: string): number {
  let i = text.length;
  while (i > 0 && text[i - 1] === char) i--;
  return text.length - i;
}

function runAtStart(text: string, char: string): number {
  let i = 0;
  while (text[i] === char) i++;
  return i;
}

function toggleQuote(text: string, start: number, end: number): FormatChange {
  const lineStartsInRange: number[] = [];
  let lineStart = text.lastIndexOf("\n", start - 1) + 1;
  for (;;) {
    lineStartsInRange.push(lineStart);
    const next = text.indexOf("\n", lineStart);
    if (next === -1 || next + 1 >= end) break;
    lineStart = next + 1;
  }

  const allQuoted = lineStartsInRange.every((at) =>
    text.startsWith(QUOTE_PREFIX, at),
  );
  const edits: TextEdit[] = lineStartsInRange
    .filter((at) => allQuoted || !text.startsWith(QUOTE_PREFIX, at))
    .map((at) =>
      allQuoted
        ? { start: at, end: at + QUOTE_PREFIX.length, insert: "" }
        : { start: at, end: at, insert: QUOTE_PREFIX },
    )
    .reverse();

  const shift = (offset: number) =>
    edits.reduce((moved, edit) => {
      if (edit.start > offset) return moved;
      const removed = Math.min(edit.end, offset) - edit.start;
      return moved + edit.insert.length - removed;
    }, offset);

  return { edits, selection: { start: shift(start), end: shift(end) } };
}

/** Aplica los cambios a un texto (para tests y para quien no use un editor). */
export function applyTextEdits(text: string, edits: readonly TextEdit[]) {
  return edits.reduce(
    (result, edit) =>
      result.slice(0, edit.start) + edit.insert + result.slice(edit.end),
    text,
  );
}
