import { Mic, FileText, Pill, Calendar, Globe } from "lucide-react-native";
import { ScopeId } from "../../backend/3_Scopes";
import { colors } from "../../theme";

// ─── Shared Defaults ──────────────────────────────────────────────────────────
// Common copy/behaviour spread into every Clarity chat config. Override only
// the fields that differ in each Chat_*.ts file.

export const CLARITY_DEFAULTS = {
  accentColor: colors.primary,
  aiLabel: "Clarity AI",
  backTo: "Clarity",
  backLabel: "Clarity",
  speechEnabled: true,
  cameraEnabled: true,
  placeholder: "Type your message...",
  typingLabel: "Typing...",
  errorMessage: "Sorry, I couldn't get a response. Please try again.",
  fallbackMessage: "No response",
  speechErrorMessage: "I couldn't hear you. Please try again.",
};

// ─── Landing-page cards ───────────────────────────────────────────────────────
// Cards shown on the Clarity landing screen — each routes to a chat scope.

export interface ClarityLandingCard {
  title: string;
  desc: string;
  icon: any;
  scopeId: ScopeId;
}

export const clarityLandingCards: ClarityLandingCard[] = [
  {
    title: "Doctor Explained",
    desc: "Record medical conversations",
    icon: Mic,
    scopeId: "clarityDoctorExplained",
  },
  {
    title: "Summarise Document",
    desc: "Simplify medical documents",
    icon: FileText,
    scopeId: "claritySummariseDocument",
  },
  {
    title: "Explain Medication",
    desc: "Understand prescriptions",
    icon: Pill,
    scopeId: "clarityExplainMedication",
  },
  {
    title: "Appointment Prep",
    desc: "Get ready for your visit",
    icon: Calendar,
    scopeId: "clarityAppointmentPrep",
  },
  {
    title: "Explain Everyday",
    desc: "Tech, news & bills made simple",
    icon: Globe,
    scopeId: "clarityExplainEveryday",
  },
];
