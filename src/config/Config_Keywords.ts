// ─── Red-Flag Keyword Library ─────────────────────────────────────────────────
// Words and phrases that should be surfaced visually inside user messages so a
// carer can spot urgent phrasing at a glance. The scanner is case-insensitive
// and whole-word; phrases with spaces are matched as exact runs. Add or remove
// entries here — the regex is rebuilt automatically.

export const RED_FLAG_KEYWORDS: string[] = [
  // Acute / emergency
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

  // Mental health
  "suicidal",
  "suicide",
  "self harm",
  "self-harm",
  "kill myself",
  "end my life",
  "want to die",

  // Medication safety
  "overdose",
  "took too much",
  "double dose",
  "dosage",

  // Open-ended urgency
  "what should I do",
  "i need help",
  "help me",
  "scared",
];
