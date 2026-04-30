import { clarityAppointmentPrep } from "./Clarity/Chat_AppointmentPrep";
import { clarityDoctorExplained } from "./Clarity/Chat_DoctorExplained";
import { clarityExplainEveryday } from "./Clarity/Chat_ExplainEveryday";
import { clarityExplainMedication } from "./Clarity/Chat_ExplainMedication";
import { clarityGeneralChat } from "./Clarity/Chat_GeneralChat";
import { claritySummariseDocument } from "./Clarity/Chat_SummariseDocument";

// Clarity is the only feature whose scopes are dispatched dynamically by ID
// (the landing card passes a scopeId string through navigation params and
// ClarityChat looks the scope up at render time). Every other feature's
// screen imports its scope directly, so they don't need a registry entry.
export const clarityScopes = {
  clarityAppointmentPrep,
  clarityDoctorExplained,
  clarityExplainEveryday,
  clarityExplainMedication,
  clarityGeneralChat,
  claritySummariseDocument,
} as const;

export type ScopeId = keyof typeof clarityScopes;
