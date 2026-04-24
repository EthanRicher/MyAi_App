import { Mic, FileText, Pill, Calendar, Globe } from "lucide-react-native";
import { ScopeId } from "../../../ai/scopes";

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
