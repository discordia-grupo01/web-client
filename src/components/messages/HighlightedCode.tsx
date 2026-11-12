"use client";

import type {
  CodeToken,
  CodeTokenKind,
} from "@discordia/client-shared/dist/format/code-highlight";

import { useEffect, useState } from "react";

type Highlighter =
  typeof import("@discordia/client-shared/dist/format/code-highlight");

const KIND_CLASS: Record<CodeTokenKind, string> = {
  keyword: "text-syntax-keyword",
  string: "text-syntax-string",
  number: "text-syntax-number",
  comment: "text-syntax-comment italic",
  function: "text-syntax-function",
  type: "text-syntax-type",
  attribute: "text-syntax-attribute",
};

let highlighter: Promise<Highlighter> | null = null;

function loadHighlighter() {
  highlighter ??= import("@discordia/client-shared/dist/format/code-highlight");
  return highlighter;
}

interface HighlightedCodeProps {
  code: string;
  language: string;
}

export function HighlightedCode({ code, language }: HighlightedCodeProps) {
  const key = `${language}\n${code}`;
  const [result, setResult] = useState<{
    key: string;
    tokens: CodeToken[] | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void loadHighlighter().then(({ highlightCode }) => {
      if (active) setResult({ key, tokens: highlightCode(code, language) });
    });
    return () => {
      active = false;
    };
  }, [key, code, language]);

  const tokens = result?.key === key ? result.tokens : null;
  if (!tokens) return code;
  return tokens.map((token, index) =>
    token.kind ? (
      <span key={index} className={KIND_CLASS[token.kind]}>
        {token.text}
      </span>
    ) : (
      token.text
    ),
  );
}
