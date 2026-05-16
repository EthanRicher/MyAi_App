import { AIScope } from "../../_AI/AI_Types";
import { buildScanPrompt } from "../_Common";

/**
 * MedView "Scan Medication" scope. Reads a prescription label or
 * medication packet (photo or pasted text) and returns a structured
 * medication record that the MedView add-screen can drop straight
 * into the form.
 */

// Field-by-field extraction rules. Shared between the text and photo
// prompts — same model, same expected output shape, only the source
// changes (free text vs vision analysis).
const EXTRACTION_RULES = `
RULES:
- Do NOT guess
- Only extract what is clearly stated
- If missing, leave fields empty
- If not medication, mark invalid

NAME — the medication name ONLY.
- Extract just the drug name (brand or generic), nothing else.
- Do NOT include the dose, strength, formulation, or quantity in this
  field — those belong in DOSE / DESCRIPTION below.
  - WRONG: "Atorvastatin 20mg"  ❌
  - WRONG: "Lipitor 20mg tablets"  ❌
  - WRONG: "Panadol Extra 500mg"  ❌
  - RIGHT: "Atorvastatin"  ✓
  - RIGHT: "Lipitor"  ✓
  - RIGHT: "Panadol Extra"  ✓
- If both a brand and a generic are printed, prefer the more
  prominent one on the label.
- Use sentence/title case — not ALL CAPS.

DOSE — the amount the patient takes IN ONE GO (per serving / per
administration). NEVER a daily total.
- If the user takes one tablet at a time, the dose is that tablet's
  strength — regardless of how often they take it.
  - "5mg tablet, twice a day" → dose: "5mg" (twice a day is FREQUENCY,
    not a multiplier — it goes in timesPerDay/times, not in dose)
  - "Atorvastatin 20mg, one tablet daily" → dose: "20mg"
  - "Panadol 500mg, one tablet three times a day" → dose: "500mg"
- ONLY multiply tablet-count × strength when the user takes MORE THAN ONE
  TABLET in a single sitting.
  - "take 2 tablets of 100mg in the morning" → dose: "200mg"
  - "take 1.5 tablets of 50mg at night" → dose: "75mg"
  - "1 tablet of 10mg in the morning" → dose: "10mg"
- Words that signal FREQUENCY (do NOT multiply by these): "once a day",
  "twice a day", "three times a day", "every 8 hours", "every morning",
  "bid", "tid", "qid", "daily", "nightly", "at bedtime", "with each meal".
- Words that signal QUANTITY PER DOSE (these DO multiply): "take 2",
  "take 1.5", "1 tablet", "two capsules", "half a tablet".
- If only a tablet strength is written with no per-dose quantity, extract
  the strength as-is.
- If the dose cannot be determined, leave "dose" empty.

TIMES — pick realistic waking-hour defaults for an elderly user. Don't
schedule doses for the middle of the night.
- If frequency is stated but exact times are not written:
  - once daily = ["08:00"]
  - twice daily = ["08:00", "20:00"]
  - three times daily = ["08:00", "14:00", "20:00"]
  - four times daily = ["08:00", "13:00", "18:00", "22:00"]

DESCRIPTION:
- Rewrite the printed instructions in clean, plain English suitable for an elderly reader
- Preserve the EXACT meaning — do not add, omit, or invent anything
- Spell out abbreviations: "1 tab po bid" → "Take 1 tablet by mouth twice a day"
- Use full words: "twice a day" instead of "2 X day", "with food" instead of "w/ food"
- Use normal sentence case, not ALL CAPS
- Keep it to one or two short sentences
- If no instructions are written, leave empty
`.trim();

// Output shape — also identical between text and photo paths.
const RESULT_SCHEMA = `
Return only valid JSON in this exact shape:

{
  "status": "Valid",
  "explanation": "",
  "medications": [
    {
      "name": "",
      "dose": "",
      "description": "",
      "timesPerDay": 0,
      "times": []
    }
  ]
}

If invalid, return:

{
  "status": "Invalid",
  "explanation": "reason",
  "medications": []
}
`.trim();

export const medviewMedicationScan: AIScope = {
  id: "medviewMedicationScan",
  responseFormat: "json",

  // Photo path. Vision analysis is the source of truth.
  buildPhotoPrompt: (analysis: string) =>
    buildScanPrompt(`
You extract medication info from a photo of a prescription or medication label.
The following is a visual analysis of the photo — use it as your source.

${analysis}

Extract the medication details below.

${EXTRACTION_RULES}

${RESULT_SCHEMA}
`.trim()),

  // Text path. Same extraction rules, used when the user types or pastes the label text.
  buildPrompt: (text: string) =>
    buildScanPrompt(`
You extract medication info from prescriptions or medication labels.

${EXTRACTION_RULES}

${RESULT_SCHEMA}

Text:
${text}
`.trim()),

  // Normalise the parsed JSON into the shape MedView expects (single med, fallback fields).
  mapOutput: (parsed: any) => {
    const status = parsed?.status || "";
    const explanation = parsed?.explanation || "";

    // Anything other than "Valid" means the AI couldn't extract a real
    // record — don't synthesize empty fields with timesPerDay:1
    // defaults that the MedView form would happily render. Return
    // empties so the caller surfaces `explanation` as an error instead.
    if (status !== "Valid") {
      return {
        status,
        explanation,
        name: "",
        dose: "",
        description: "",
        timesPerDay: 0,
        times: [],
      };
    }

    const med = parsed?.medications?.[0] || {};

    const times = Array.isArray(med?.times)
      ? med.times
          .map((time: any) => (typeof time === "string" ? time.trim() : ""))
          .filter(Boolean)
      : [];

    // Backfill timesPerDay from the times array length when the
    // model didn't send one. Stay 0 when nothing was extracted —
    // otherwise MedViewAdd would render a phantom empty time slot
    // for a "Valid" scan that didn't carry any schedule info.
    const timesPerDay =
      typeof med?.timesPerDay === "number" && med.timesPerDay > 0
        ? med.timesPerDay
        : times.length;

    return {
      status,
      explanation,
      name: typeof med?.name === "string" ? med.name.trim() : "",
      dose: typeof med?.dose === "string" ? med.dose.trim() : "",
      description:
        typeof med?.description === "string" ? med.description.trim() : "",
      timesPerDay,
      times,
    };
  },
};
