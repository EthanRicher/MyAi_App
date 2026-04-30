// Shared markdown line parser used by the chat bubble renderer and the
// fullscreen reader. Keeps the regex, title-dedup, and truncation logic in
// one place so all surfaces stay in lockstep.

import type { ReactNode } from "react";

export type MarkdownToken =
  | { kind: "mainTitle"; text: string }
  | { kind: "subTitle"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "paragraph"; text: string };

export type TokenRenderers = {
  mainTitle: (token: { text: string }, i: number) => ReactNode;
  subTitle: (token: { text: string }, i: number) => ReactNode;
  bullet: (token: { text: string }, i: number) => ReactNode;
  paragraph: (token: { text: string }, i: number) => ReactNode;
};

// Pure dispatch: parse markdown then delegate each token to a per-kind
// renderer. Keeps the switch in one place so consumers only define their
// custom JSX, not the dispatch boilerplate.
export function renderMarkdownWith(
  text: string,
  renderers: TokenRenderers
): ReactNode[] {
  return parseMarkdown(text).map((token, i) => {
    switch (token.kind) {
      case "mainTitle": return renderers.mainTitle(token, i);
      case "subTitle": return renderers.subTitle(token, i);
      case "bullet": return renderers.bullet(token, i);
      case "paragraph": return renderers.paragraph(token, i);
    }
  });
}

export type InlineSegment = { kind: "text" | "bold"; text: string };

const TITLE_RE = /^\*\*([^*]+)\*\*:?$/;
const BULLET_RE = /^[-•*]\s+(.+)$/;
const INLINE_BOLD_RE = /\*\*([^*\n]+)\*\*/g;

// Splits a single line of text into runs, marking any **bold** spans so
// renderers can apply a bold style instead of leaking the asterisks.
export function parseInline(text: string): InlineSegment[] {
  const out: InlineSegment[] = [];
  let i = 0;
  for (const m of text.matchAll(INLINE_BOLD_RE)) {
    if (m.index! > i) out.push({ kind: "text", text: text.slice(i, m.index) });
    out.push({ kind: "bold", text: m[1] });
    i = m.index! + m[0].length;
  }
  if (i < text.length) out.push({ kind: "text", text: text.slice(i) });
  return out;
}

export function parseMarkdown(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = [];
  let mainTitleSeen = false;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const titleMatch = trimmed.match(TITLE_RE);
    if (titleMatch) {
      const rawTitle = titleMatch[1].replace(/^:+|:+$/g, "").trim();
      if (!mainTitleSeen) {
        mainTitleSeen = true;
        tokens.push({ kind: "mainTitle", text: rawTitle });
      } else {
        tokens.push({ kind: "subTitle", text: rawTitle });
      }
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_RE);
    if (bulletMatch) {
      tokens.push({ kind: "bullet", text: bulletMatch[1] });
      continue;
    }

    tokens.push({ kind: "paragraph", text: trimmed });
  }

  return tokens;
}
