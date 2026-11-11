import type { CSSProperties } from "react";
import type { BaseEditor } from "slate";
import type { HistoryEditor } from "slate-history";
import type { ReactEditor } from "slate-react";

export interface LineElement {
  type: "line";
  children: PlainText[];
}

export interface PlainText {
  text: string;
}

export interface DraftLeaf extends PlainText {
  bold?: true;
  italic?: true;
  strike?: true;
  code?: true;
  codeBlock?: true;
  marker?: true;
  quote?: true;
  heading?: 1 | 2 | 3;
  mentionStyle?: CSSProperties;
}

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: LineElement;
    Text: DraftLeaf;
  }
}
