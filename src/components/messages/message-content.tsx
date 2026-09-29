import { tokenizeMessageContent } from "@discordia/client-shared";

import { Fragment } from "react";

export function MessageContent({ content }: { content: string }) {
  return (
    <p className="text-content text-sm leading-relaxed break-words whitespace-pre-wrap">
      {tokenizeMessageContent(content).map((token, index) =>
        token.kind === "text" ? (
          <Fragment key={index}>{token.value}</Fragment>
        ) : (
          <span
            key={index}
            className="bg-highlight/15 text-highlight rounded px-0.5"
          >
            {token.value}
          </span>
        ),
      )}
    </p>
  );
}
