import { clarityAppointmentPrep } from "./clarityAppointmentPrep";
import { clarityDoctorExplained } from "./clarityDoctorExplained";
import { clarityExplainEveryday } from "./clarityExplainEveryday";
import { clarityExplainMedication } from "./clarityExplainMedication";
import { clarityGeneralChat } from "./clarityGeneralChat";
import { claritySummariseDocument } from "./claritySummariseDocument";
import { medviewMedicationChat } from "./medviewMedicationChat";
import { medviewMedicationScan } from "./medviewMedicationScan";
import { medviewScheduleSupport } from "./medviewScheduleSupport";

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
} as const;

export type ScopeId = keyof typeof scopeRegistry;

export const getScope = (id: ScopeId) => {
  return scopeRegistry[id];
};