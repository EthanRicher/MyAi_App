import { callOpenAIJson } from "../../4_AI/AI_Fetch";

// Second-pass urgency check that catches paraphrased or contextual concerns
// the hardcoded keyword list misses (e.g. "I'd be better off gone", "no point
// in waking up", an obvious scam pattern, a likely overdose). Returns a
// short, carer-readable reason when the message warrants a flag.

type AIFlagResult = {
  concerning: boolean;
  reason?: string;
};

const PROMPT = `You are a safety classifier for an elderly user's chat assistant.
Decide whether the user message below contains something a carer should review.

Flag if the message suggests ANY of:
- suicidal ideation, self-harm, or wanting to die (any phrasing, including paraphrase)
- severe distress, hopelessness, or feeling like a burden
- an active medical emergency (chest pain, can't breathe, stroke signs, severe injury)
- a likely medication overdose or dangerous medication confusion
- ongoing abuse, coercion, or threats from someone
- being actively scammed (a stranger demanding money/access right now)

Do NOT flag:
- general health questions ("what is cholesterol")
- ordinary sadness, anxiety, or boredom
- questions about a doctor's appointment
- routine medication queries
- everyday small talk

Return ONLY valid JSON in this exact shape:
{ "concerning": <boolean>, "reason": "<one short carer-readable phrase, max 80 chars, OR empty string>" }

USER MESSAGE:
`;

export async function flagWithAI(text: string): Promise<AIFlagResult> {
  const trimmed = (text || "").trim();
  if (!trimmed) return { concerning: false };

  const parsed = await callOpenAIJson<{ concerning: boolean; reason: string }>(
    "aiFlag",
    PROMPT + trimmed
  );
  if (!parsed) return { concerning: false };

  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : undefined;

  return {
    concerning: !!parsed.concerning,
    reason: parsed.concerning ? reason : undefined,
  };
}
