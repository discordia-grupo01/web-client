import { type Descendant, type Editor, Node, type Point } from "slate";

import type { LineElement } from "@/types/slate.types";

export function textToValue(text: string): LineElement[] {
  return text.split("\n").map((line) => ({
    type: "line",
    children: [{ text: line }],
  }));
}

export function valueToText(nodes: readonly Descendant[]): string {
  return nodes.map((node) => Node.string(node)).join("\n");
}

export function pointToOffset(editor: Editor, point: Point): number {
  const [line] = point.path;
  let offset = 0;
  for (let i = 0; i < line; i++) {
    offset += Node.string(editor.children[i]).length + 1;
  }
  return offset + point.offset;
}

export function offsetToPoint(editor: Editor, offset: number): Point {
  let remaining = Math.max(0, offset);
  const lines = editor.children;
  for (let i = 0; i < lines.length; i++) {
    const length = Node.string(lines[i]).length;
    if (remaining <= length) return { path: [i, 0], offset: remaining };
    remaining -= length + 1;
  }
  const last = Math.max(0, lines.length - 1);
  return {
    path: [last, 0],
    offset: lines.length > 0 ? Node.string(lines[last]).length : 0,
  };
}

export function lineStarts(editor: Editor): number[] {
  const starts: number[] = [];
  let offset = 0;
  for (const line of editor.children) {
    starts.push(offset);
    offset += Node.string(line).length + 1;
  }
  return starts;
}
