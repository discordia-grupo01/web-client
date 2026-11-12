import {
  isActiveMention,
  MENTION_DELETED_ROLE_NAME,
  type MessageBlock,
  type MessageInline,
  type MessageList,
  type MessageMentions,
  parseMessageMarkdown,
  splitHighlight,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

import { Fragment, type ReactNode } from "react";

import { MentionChip } from "./MentionChip";
import { Spoiler } from "./Spoiler";
import { useMessageMentions } from "@/contexts/MentionsContext";

interface MessageContentProps {
  content: string;
  /**
   * Menciones que el back reconocio en el mensaje. Lo que no figura ahi (por
   * ejemplo un `@everyone` de alguien sin permiso) se dibuja como texto comun.
   */
  mentions?: MessageMentions;
  /** Va pegado al final del texto, en el mismo renglon si entra (ej. "(editado)"). */
  suffix?: ReactNode;
  /** Termino a resaltar en el texto (resultados de busqueda). */
  highlight?: string;
}

const HEADING_CLASS: Record<1 | 2 | 3, string> = {
  1: "font-display text-xl font-bold leading-snug",
  2: "font-display text-lg font-bold leading-snug",
  3: "font-display text-base font-bold leading-snug",
};

export function MessageContent({
  content,
  mentions = {},
  suffix,
  highlight,
}: MessageContentProps) {
  const { resolveMention } = useMessageMentions();
  const blocks = parseMessageMarkdown(content);
  const lastIndex = blocks.length - 1;
  const suffixInline =
    blocks.length > 0 && blocks[lastIndex].kind !== "code-block";

  function renderText(value: string): ReactNode {
    if (!highlight) return value;
    return splitHighlight(value, highlight).map((part, i) =>
      part.isMatch ? (
        <mark key={i} className="bg-highlight/30 text-content rounded-sm">
          {part.text}
        </mark>
      ) : (
        part.text
      ),
    );
  }

  function renderInline(nodes: readonly MessageInline[]): ReactNode {
    return nodes.map((node, index) => {
      switch (node.kind) {
        case "text":
          return <Fragment key={index}>{renderText(node.value)}</Fragment>;
        case "bold":
          return (
            <strong key={index} className="font-bold">
              {renderInline(node.children)}
            </strong>
          );
        case "italic":
          return <em key={index}>{renderInline(node.children)}</em>;
        case "strike":
          return <s key={index}>{renderInline(node.children)}</s>;
        case "underline":
          return <u key={index}>{renderInline(node.children)}</u>;
        case "spoiler":
          return <Spoiler key={index}>{renderInline(node.children)}</Spoiler>;
        case "link":
          return (
            <a
              key={index}
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              title={node.url}
              className="text-sky hover:underline"
            >
              {renderInline(node.children)}
            </a>
          );
        case "code":
          return (
            <code
              key={index}
              className="bg-surface-sunken border-line rounded border px-1 py-px font-mono text-[0.85em]"
            >
              {renderText(node.value)}
            </code>
          );
        case "channel":
          return <MentionChip key={index} text={node.value} />;
      }

      if (!isActiveMention(node, mentions)) {
        return <Fragment key={index}>{node.value}</Fragment>;
      }
      if (node.kind === "everyone") {
        return <MentionChip key={index} text={node.value} isStrong />;
      }
      const resolved = resolveMention?.(node.kind, node.id);
      const fallbackName =
        node.kind === "role" ? MENTION_DELETED_ROLE_NAME : UNKNOWN_USER_NAME;
      return (
        <MentionChip
          key={index}
          text={`@${resolved?.name ?? fallbackName}`}
          color={resolved?.color}
        />
      );
    });
  }

  function renderList(
    list: MessageList,
    depth: number,
    tail: ReactNode,
    key?: number,
  ): ReactNode {
    const Tag = list.ordered ? "ol" : "ul";
    const marker = list.ordered
      ? "list-decimal"
      : depth === 0
        ? "list-disc"
        : "list-[circle]";
    const last = list.items.length - 1;
    return (
      <Tag
        key={key}
        start={list.ordered && list.start !== 1 ? list.start : undefined}
        className={`${marker} pl-5`}
      >
        {list.items.map((item, i) => {
          const itemTail = i === last ? tail : null;
          const lastList = item.lists.length - 1;
          return (
            <li key={i}>
              {renderInline(item.children)}
              {lastList === -1 ? itemTail : null}
              {item.lists.map((nested, j) =>
                renderList(
                  nested,
                  depth + 1,
                  j === lastList ? itemTail : null,
                  j,
                ),
              )}
            </li>
          );
        })}
      </Tag>
    );
  }

  function renderBlock(block: MessageBlock, index: number): ReactNode {
    const tail = index === lastIndex && suffixInline ? suffix : null;
    switch (block.kind) {
      case "paragraph":
        return (
          <p key={index}>
            {renderInline(block.children)}
            {tail}
          </p>
        );
      case "heading": {
        const Tag = `h${block.level}` as const;
        return (
          <Tag key={index} className={HEADING_CLASS[block.level]}>
            {renderInline(block.children)}
            {tail}
          </Tag>
        );
      }
      case "subtext":
        return (
          <p key={index} className="text-content-subtle text-xs">
            {renderInline(block.children)}
            {tail}
          </p>
        );
      case "list":
        return renderList(block, 0, tail, index);
      case "quote":
        return (
          <blockquote
            key={index}
            className="border-line-strong border-l-4 pl-3"
          >
            {renderInline(block.children)}
            {tail}
          </blockquote>
        );
      case "code-block":
        return (
          <pre
            key={index}
            className="bg-surface-sunken border-line overflow-x-auto rounded-md border p-2 font-mono text-[0.85em] whitespace-pre"
          >
            <code>{renderText(block.value)}</code>
          </pre>
        );
    }
  }

  return (
    <div className="text-content flex flex-col gap-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
      {blocks.map(renderBlock)}
      {suffixInline || !suffix ? null : <div>{suffix}</div>}
    </div>
  );
}
