import { clarityAppointmentPrep } from "./clarityAppointmentPrep";
import { clarityDoctorExplained } from "./clarityDoctorExplained";
import { clarityExplainEveryday } from "./clarityExplainEveryday";
import { clarityExplainMedication } from "./clarityExplainMedication";
import { clarityGeneralChat } from "./clarityGeneralChat";
import { claritySummariseDocument } from "./claritySummariseDocument";
import { medviewMedicationChat } from "./medviewMedicationChat";
import { medviewMedicationScan } from "./medviewMedicationScan";
import { medviewScheduleSupport } from "./medviewScheduleSupport";
import { companionChat } from "./companionChat";

export const scopeRegistry = {
  clarityAppointmentPrep,
  clarityDoctorExplained,
  clarityExplainEveryday,
  clarityExplainMedication,
  clarityGeneralChat,
  claritySummariseDocument,
  medviewMedicationChat,
  medviewMedicationScan,
  medviewScheduleSupport,
  companionChat,
} as const;

export type ScopeId = keyof typeof scopeRegistry;

export const getScope = (id: ScopeId) => {
  return scopeRegistry[id];
};