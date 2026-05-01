import { callOpenAIJson } from "../../_AI/AI_Fetch";
import { debugLog } from "../../_AI/AI_Debug";

// Second-pass urgency check that catches paraphrased or contextual concerns
// the hardcoded keyword list misses (e.g. "I'd be better off gone", "no point
// in waking up", an obvious scam pattern, a likely overdose). Returns a
// short, carer-readable reason when the message warrants a flag.

type AIFlagResult = {
  concerning: boolean;
  reason?: string;
};

const PROMPT = `You are a safety classifier for an elderly user's chat assistant.
A separate hardcoded keyword list already catches obvious red-flag terms
("chest pain", "emergency", "suicide", etc.). YOUR job is the second pass:
read for MEANING and PHRASING, not specific words. Catch what someone would
say AROUND a problem when they don't use the obvious word for it.

KEY PRINCIPLE — read the WHOLE message and combine the words. Individual
words like "feel", "hurt", "myself", "want", "go", "stop", "end" are
ordinary on their own, but COMBINATIONS form clear safety concerns. If the
combined meaning of the words points at any of the categories below, flag
it — even though no single word in isolation would.

Flag if the message PHRASING suggests ANY of:
- Suicidal ideation or wanting to die — including paraphrase
  ("I'd be better off gone", "no point waking up tomorrow", "everyone would
  be fine without me", "thinking of just stopping", "I want it all to end",
  "I don't want to be here anymore", "ready to go").
- Self-harm intent — combinations of "feel like" / "want to" / "going to"
  with "hurt myself", "harm myself", "cut myself", "make the pain stop",
  "punish myself", "do something to myself". Phrases like "I feel like
  hurting myself" MUST be flagged even though every word is benign in
  isolation.
- Severe distress, hopelessness, or feeling like a burden — even when worded
  gently ("I'm just so tired of all this", "I feel like a weight on them",
  "nothing matters anymore", "I can't keep doing this").
- An active medical emergency described in plain words ("can't catch my
  breath", "left side has gone numb", "feels like an elephant on my chest",
  "I fell and can't get up").
- A likely medication mix-up or accidental overdose ("I think I took two
  doses", "I can't remember if I took it twice", "I doubled up by mistake").
- Ongoing abuse, coercion, or being controlled by someone ("they won't let
  me leave the house", "I'm not allowed to use the phone alone").
- Being actively scammed RIGHT NOW ("they want me to send a gift card",
  "the bank man on the phone says my account is locked").

Pay attention to TONE and INDIRECT phrasing. A worried, defeated, or
alarmed phrasing without an obvious red-flag word still counts. If the
message reads like someone hinting at one of the above, flag it.

When in doubt about a phrase that COMBINES intent words (feel/want/going to)
with self-directed harm-adjacent words (hurt/end/stop/disappear/myself),
err on the side of flagging — a missed signal is worse than a false alarm.

Do NOT flag:
- General health questions ("what is cholesterol", "is paracetamol safe")
- Ordinary sadness, mild anxiety, boredom, or venting without despair
- Questions about a doctor's appointment
- Routine medication queries
- Everyday small talk, weather, hobbies, recipes, etc.

Return ONLY valid JSON in this exact shape:
{ "concerning": <boolean>, "reason": "<one short carer-readable phrase, max 80 chars, OR empty string>" }

The "reason" should describe the CONCERN, not quote the message. Example
reasons: "Possible passive suicidal ideation", "Sounds like chest-pain
emergency", "Mentions being controlled at home", "Possible double-dose of
medication".

USER MESSAGE:
`;

export async function flagWithAI(text: string): Promise<AIFlagResult> {
  const trimmed = (text || "").trim();
  if (!trimmed) return { concerning: false };

  const parsed = await callOpenAIJson<{ concerning: boolean; reason: string }>(
    "Check_AIFlag",
    PROMPT + trimmed
  );
  if (!parsed) return { concerning: false };

  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : undefined;

  const result: AIFlagResult = {
    concerning: !!parsed.concerning,
    reason: parsed.concerning ? reason : undefined,
  };

  debugLog("Check_AIFlag", "Result", "Judged", {
    concerning: result.concerning,
    reason: result.reason ?? "",
  });

  return result;
}
