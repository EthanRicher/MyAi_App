import { AIScope } from "../../_AI/AI_Types";
import { buildSharedPrompt } from "../_Common";

/**
 * SenseGuard symptom log scope. Takes a free-form description of how
 * the user is feeling and produces a structured first-person log
 * entry (title, bullet summary, severity 1 to 6) the symptom-log
 * screen can save. Also decides whether the message even counts as
 * a symptom in the first place — pure activity ("I went for a walk")
 * doesn't.
 */

const TOPIC = "log a symptom";

export type SymptomLogOutput = {
  title: string;       // Short label for the log entry.
  summary: string;     // First-person "- " bullet list.
  severity: number;    // 1 to 6, or 0 when isSymptom is false.
  isSymptom: boolean;  // False for non-symptom messages so the UI can skip logging.
};

export const senseguardSymptomLog: AIScope = {
  id: "senseguardSymptomLog",
  responseFormat: "json",

  buildPrompt: (text: string) =>
    buildSharedPrompt(
      `
You are logging a symptom on the speaker's behalf. The speaker IS the patient — they are describing how THEY feel. Read their freeform description below and produce a clean, structured log entry, written in FIRST PERSON ("I"), as if the speaker is writing it themselves.

WHAT THEY SAID:
${text}

FIRST DECIDE: does this message describe an actual SYMPTOM or HEALTH event?

STRICT TEST — for "isSymptom" to be true, the message MUST explicitly
mention at least one bodily or mental sensation/feeling/condition. For
example any of these (or close paraphrases): pain, ache, sore, hurt,
hurting, burning, throbbing, stinging, itchy, numb, tingling, tight,
stiff, swollen, bruised, bleeding, dizzy, faint, lightheaded, off-balance,
nauseous, queasy, sick to my stomach, vomiting, diarrhoea, constipated,
short of breath, breathless, can't breathe, chest tight, fatigue, tired,
exhausted, weak, shaky, trembling, sweaty, hot, cold, fever, chills, rash,
hives, blurry, ringing in ears, headache, migraine, cramp, anxious,
panicky, low mood, sad, depressed, can't sleep, slept badly, palpitations,
racing heart.

PURE ACTIVITY MESSAGES ARE NOT SYMPTOMS. If the message just describes
something the user did or is doing, with no sensation attached, it is NOT
a symptom. Examples that MUST return isSymptom: false:
- "I went for a walk"
- "I went to the shops"
- "I had toast for breakfast"
- "I watched TV"
- "I called my daughter"
- "I sat down"
- "I'm gardening today"
- "I'm just home"

PAIRED MESSAGES ARE SYMPTOMS. If an activity is paired with a sensation,
the sensation is the symptom. Examples that ARE symptoms (isSymptom: true):
- "I went for a walk and my knee was hurting" → knee pain
- "I sat down because I felt dizzy" → dizziness
- "I had breakfast and felt nauseous" → nausea
- "I called my daughter and got really anxious" → anxiety

EMPTY / OFF-TOPIC / GREETING / NONSENSE messages ("hello", "hi", "asdf",
"what time is it", "thanks") are NOT symptoms.

When in doubt, set "isSymptom": false. A missed log is better than a
wrong log — the user can always rephrase. NEVER invent a symptom that
the user did not explicitly mention.

If "isSymptom" is false, leave the other fields empty/zero.
If "isSymptom" is true, populate the entry as described below — using
ONLY the sensation(s) the user actually mentioned, not the surrounding
activity.

Return ONLY valid JSON in this exact shape:

{
  "isSymptom": <boolean>,
  "title": "<short concise title, max 40 characters, sentence case, no quotes — empty string if isSymptom is false>",
  "summary": "<one fact per line, each line starting with '- ', written in first person — empty string if isSymptom is false>",
  "severity": <integer between 1 and 6 — 0 if isSymptom is false>
}

TITLE rules:
- Short and specific, e.g. "Sharp chest pain", "Headache after lunch", "Dizzy when standing up".
- Sentence case. No leading/trailing punctuation.
- Do NOT use "user", "patient", "they". The title is a label, not a sentence — no need for "I" in the title.

SUMMARY rules — VERY IMPORTANT:
- Write in FIRST PERSON, as the speaker. Use "I", "my", "me".
  - GOOD: "- I have a sharp pain in my chest"
  - GOOD: "- I felt dizzy when I stood up"
  - GOOD: "- My headache started after lunch"
  - BAD: "- The user has a sharp pain in their chest"
  - BAD: "- They are feeling dizzy"
  - BAD: "- Patient reports headache"
- Each "- " bullet must be SHORT — aim for ~6 to 10 words, max 12. Keep it on one line.
- One simple fact per bullet. Do NOT combine multiple facts with "and" / commas.
- Cover where it is, what it feels like, when it started, any triggers, related symptoms — but only what the speaker actually said.
- Do NOT invent details. If the description is vague, write fewer bullets — don't pad.

SEVERITY rules (best estimate from the words used):
- 1 = mild / barely noticeable
- 2 = mild but persistent
- 3 = moderate / interfering with the day
- 4 = significant
- 5 = severe
- 6 = very severe / urgent (chest pain, breathing difficulty, sudden weakness, severe bleeding)
- If the speaker uses urgent language ("can't breathe", "severe", "really bad", "emergency", "passing out"), lean high.
`.trim(),
      "auto",
      TOPIC
    ),

  // Normalise the parsed JSON. Severity gets clamped to 0-6 and rounded.
  mapOutput: (parsed: any): SymptomLogOutput => ({
    isSymptom: !!parsed?.isSymptom,
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    summary: typeof parsed?.summary === "string" ? parsed.summary.trim() : "",
    severity:
      typeof parsed?.severity === "number"
        ? Math.max(0, Math.min(6, Math.round(parsed.severity)))
        : 0,
  }),
};
