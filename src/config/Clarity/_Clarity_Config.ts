import { Mic, FileText, Pill, Calendar, Globe } from "lucide-react-native";
import { ScopeId } from "../../backend/3_Scopes";
import { colors } from "../../theme";

/**
 * Shared scaffolding for every Clarity chat config plus the
 * landing-page card list. Each Chat_*.ts under config/Clarity/
 * spreads CLARITY_DEFAULTS and overrides only what differs.
 */

// Defaults every Clarity chat inherits.
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

// One Clarity landing card. Tapping it opens ClarityChat with the matching scope.
export interface ClarityLandingCard {
  title: string;     // Card heading.
  desc: string;      // One-line description.
  icon: any;         // Lucide icon component.
  scopeId: ScopeId;  // Scope key that ClarityChat dispatches by.
}

// Cards shown on the Clarity landing screen, in order.
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
