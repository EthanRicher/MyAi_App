import { callOpenAIJson } from "../_AI/AI_Fetch";
import { debugLog } from "../_AI/AI_Debug";

// Post-scope step that runs AFTER a saveable chat scope produces its reply.
// Judges whether the turn produced something worth saving (a complete letter
// draft, a finished plan, a family-member record, a memory record, a poem,
// a story, a structured note). When yes, returns a one-sentence save offer
// to append to the reply and a suggested title for the save modal.
//
// Lives in stage 6 because it consumes the main reply, not the user input.
// Scopes themselves stay pure conversational generators — they don't carry
// any save-flow logic anymore.

export type SaveOfferResult = {
  shouldOffer: boolean;
  suggestedTitle?: string;
  offerSentence?: string;
};

const PROMPT_HEADER = `You are a save-offer judge for an elderly user's chat assistant.
Read the user's last message and the AI reply below, then decide whether the
reply contains something worth saving as a re-readable record.

OFFER SAVE for: a complete letter draft, a finished daily plan, a family
member record, a memory record, a poem, a story, a structured note, or any
other complete artefact the user could come back to later.

DO NOT OFFER SAVE for:
- Greetings, small talk, or generic chat
- Mid-draft brainstorms, clarifying questions, partial answers
- Single-sentence replies, expressions of feeling without an artefact
- Lists of options where the user has not yet picked one

If you decide to offer save, write a warm one-sentence offer that frames TWO
options (save now OR keep going) — never imply saving is the only path.
Examples: "Would you like to save this letter, or keep editing it?",
"Should I save these family notes, or do you want to add more?".

Return ONLY valid JSON in this exact shape. Empty strings if shouldOffer is false.
{
  "shouldOffer": <boolean>,
  "suggestedTitle": "<short title, max 60 chars, no quotes>",
  "offerSentence": "<one warm sentence offering save vs continue>"
}
`;

export async function runSaveOfferPost({
  userMessage,
  aiReply,
}: {
  userMessage: string;
  aiReply: string;
}): Promise<SaveOfferResult> {
  if (!aiReply.trim()) return { shouldOffer: false };

  const prompt =
    PROMPT_HEADER +
    `\nUSER'S LAST MESSAGE:\n"""\n${userMessage.replace(/"""/g, '"')}\n"""\n` +
    `\nAI REPLY (judge this):\n"""\n${aiReply.replace(/"""/g, '"')}\n"""\n`;

  const parsed = await callOpenAIJson<{
    shouldOffer: boolean;
    suggestedTitle: string;
    offerSentence: string;
  }>("Post_SaveOffer", prompt);
  if (!parsed || !parsed.shouldOffer) {
    debugLog("Post_SaveOffer", "Result", "Skipped - not save-worthy");
    return { shouldOffer: false };
  }

  const suggestedTitle =
    typeof parsed.suggestedTitle === "string" && parsed.suggestedTitle.trim()
      ? parsed.suggestedTitle.trim().slice(0, 60)
      : undefined;
  const offerSentence =
    typeof parsed.offerSentence === "string" && parsed.offerSentence.trim()
      ? parsed.offerSentence.trim()
      : undefined;

  if (!suggestedTitle || !offerSentence) {
    debugLog("Post_SaveOffer", "Result", "Skipped - not save-worthy");
    return { shouldOffer: false };
  }

  debugLog("Post_SaveOffer", "Result", "Decision", {
    shouldOffer: true,
    suggestedTitle,
  });

  return { shouldOffer: true, suggestedTitle, offerSentence };
}
