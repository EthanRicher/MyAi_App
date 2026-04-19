import { clarityAppointmentPrep } from "./clarity/appointmentPrep";
import { clarityDoctorExplained } from "./clarity/doctorExplained";
import { clarityExplainEveryday } from "./clarity/explainEveryday";
import { clarityExplainMedication } from "./clarity/explainMedication";
import { clarityGeneralChat } from "./clarity/generalChat";
import { claritySummariseDocument } from "./clarity/summariseDocument";
import { clarityImageTriage } from "./clarity/imageTriage";
import { medviewMedicationChat } from "./medview/medicationChat";
import { medviewMedicationScan } from "./medview/medicationScan";
import { medviewScheduleSupport } from "./medview/scheduleSupport";
import { companionChat } from "./companion/companionChat";
import { mainDashboardTriage } from "./main/dashboardTriage";

export const scopeRegistry = {
  clarityAppointmentPrep,
  clarityDoctorExplained,
  clarityExplainEveryday,
  clarityExplainMedication,
  clarityGeneralChat,
  claritySummariseDocument,
  clarityImageTriage,
  medviewMedicationChat,
  medviewMedicationScan,
  medviewScheduleSupport,
  companionChat,
  mainDashboardTriage,
} as const;

export type ScopeId = keyof typeof scopeRegistry;

export const getScope = (id: ScopeId) => {
  return scopeRegistry[id];
};

// Sub-folder re-exports
export * from "./clarity";
export * from "./medview";
export * from "./companion";
export * from "./main";
export * from "./_shared";
