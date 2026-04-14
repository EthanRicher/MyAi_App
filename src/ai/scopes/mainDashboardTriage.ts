import { AIScope } from "../core/types";

export type TriageOutput = {
  reply: string;
  route: string;
  routeLabel: string;
};

// Each entry is grounded in the actual screen code so the AI picks the right one.
const ROUTES = `
route: "Home"
label: "All Features"
use for: not sure what they want, want to browse everything, general "what can you do?" questions

route: "Clarity"
label: "Clarity"
use for: understanding medical information, explain what a doctor said, simplify medical documents, understand prescriptions/medications, get ready for an appointment, explain bills/tech/news in plain language, general health questions

route: "ClarityRecord"
label: "Record a Conversation"
use for: recording a live doctor or medical conversation so it can be simplified into plain language afterwards

route: "ClarityChat"
label: "Medical Chat"
use for: chat-style questions about medical topics, asking "what does X mean?", explaining a diagnosis, asking about side effects from a typed message

route: "MedView"
label: "Medications"
use for: viewing the full medication list, seeing today's medication progress, adding a new medication, general medication management

route: "MedViewSchedule"
label: "Medication Schedule"
use for: checking what medications to take today and when, ticking off doses as taken, seeing the daily schedule

route: "MedViewAdd"
label: "Add a Medication"
use for: adding a new medication by scanning a prescription photo or typing details manually

route: "MedViewChat"
label: "Medication Chat"
use for: asking AI questions about a specific medication — what it is for, side effects, interactions, when to take it

route: "Companion"
label: "Companion"
use for: feeling lonely, wanting to chat, brain games, trivia, planning the day, calming down/breathing exercises, asking any general question, sharing a story or memory, writing a letter, feeling emotional or needing support

route: "SenseGuard"
label: "Symptom Tracker"
use for: logging a symptom, recording how they feel today, tracking mood (great/ok/low/worried/struggling), checking recent symptom history, preparing a symptom summary for a doctor visit

route: "SafeHarbour"
label: "Safe Harbour"
use for: a suspicious email/text/call, worried about a scam, want to check if a message is real, online safety advice, scam warning signs, protecting personal or financial information
`.trim();

export const mainDashboardTriage: AIScope = {
  id: "mainDashboardTriage",
  responseFormat: "json",

  buildPrompt: (input: string) => `
You are a warm, friendly health assistant helping an elderly user navigate an app.
The user just spoke a request. Your job is to:
1. Write a short, friendly reply (1–2 sentences) acknowledging what they said and telling them where you're sending them.
2. Pick the single best route from the list below.

AVAILABLE ROUTES:
${ROUTES}

USER SAID:
"${input}"

Respond ONLY with valid JSON in this exact shape:
{
  "reply": "...",
  "route": "...",
  "routeLabel": "..."
}

Rules:
- reply must be warm, clear, plain English. No jargon. Maximum 2 sentences.
- route must be exactly one of the route values listed above (case-sensitive).
- routeLabel must match the label for the chosen route exactly.
- If the user is unclear or you are unsure, pick "Home" with a warm "let me show you everything" reply.
`.trim(),

  mapOutput: (parsed: any): TriageOutput => ({
    reply: parsed?.reply ?? "Let me help you with that.",
    route: parsed?.route ?? "Home",
    routeLabel: parsed?.routeLabel ?? "All Features",
  }),
};
