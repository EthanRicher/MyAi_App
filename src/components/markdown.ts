// Shared markdown line parser used by the chat bubble renderer and the
// fullscreen reader. Keeps the regex, title-dedup, and truncation logic in
// one place so both surfaces stay in lockstep.

export type MarkdownToken =
  | { kind: "mainTitle"; text: string }
  | { kind: "subTitle"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "paragraph"; text: string };

const TITLE_RE = /^\*\*([^*]+)\*\*:?$/;
const BULLET_RE = /^[-•*]\s+(.+)$/;

export function parseMarkdown(text: string, maxTitleChars = 30): MarkdownToken[] {
  const tokens: MarkdownToken[] = [];
  let mainTitleSeen = false;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const titleMatch = trimmed.match(TITLE_RE);
    if (titleMatch) {
      let rawTitle = titleMatch[1].replace(/^:+|:+$/g, "").trim();
      if (rawTitle.length > maxTitleChars) {
        rawTitle = rawTitle.slice(0, maxTitleChars).trimEnd() + "…";
      }
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
