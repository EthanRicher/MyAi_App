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
import { senseguardSymptomLog } from "./senseguard/symptomLog";
import { safeHarbourScamCheck } from "./safeharbour/scamCheck";

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
  senseguardSymptomLog,
  safeHarbourScamCheck,
} as const;

export type ScopeId = keyof typeof scopeRegistry;

export const getScope = (id: ScopeId) => scopeRegistry[id];
