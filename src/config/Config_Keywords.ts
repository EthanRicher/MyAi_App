/**
 * Red-flag keyword library. Words and phrases surfaced visually
 * inside user messages (red pill inline) so a carer can spot urgent
 * phrasing at a glance. The scanner (B_Check_Keywords) is
 * case-insensitive and whole-word; phrases with spaces match as
 * exact runs.
 *
 * RELATED LIST — there's a separate phrase list for the runtime
 * distress backstop in src/backend/_AI/AI_DistressGuard.ts
 * (`RED_PHRASES` and `AMBER_PHRASES`). That one drives the
 * short-circuit behaviour (canned crisis response, AMBER injection)
 * BEFORE the AI call. This list drives the visual highlight on the
 * user bubble. They overlap (`"kill myself"`, `"want to die"`, etc.)
 * but are intentionally independent — different jobs, different
 * tuning. If you add a phrase to one, consider whether it belongs
 * in the other too.
 */

export const RED_FLAG_KEYWORDS: string[] = [
  // Acute / emergency.
  "emergency",
  "chest pain",
  "trouble breathing",
  "can't breathe",
  "cannot breathe",
  "shortness of breath",
  "severe pain",
  "passed out",
  "passing out",
  "unconscious",
  "stroke",
  "heart attack",
  "allergic reaction",
  "anaphylaxis",
  "bleeding",

  // Mental health.
  "suicidal",
  "suicide",
  "self harm",
  "self-harm",
  "kill myself",
  "end my life",
  "want to die",

  // Medication safety.
  "overdose",
  "took too much",
  "double dose",
  "dosage",

  // Open-ended urgency.
  "what should I do",
  "i need help",
  "help me",
  "scared",
];
