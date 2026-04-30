import { clarityGeneralChat } from "./Chat_GeneralChat";
import { clarityDoctorExplained } from "./Chat_DoctorExplained";
import { clarityExplainMedication } from "./Chat_ExplainMedication";
import { clarityExplainEveryday } from "./Chat_ExplainEveryday";
import { clarityAppointmentPrep } from "./Chat_AppointmentPrep";
import { claritySummariseDocument } from "./Chat_SummariseDocument";
import type { ChatConfig } from "../_Common/ChatConfig_Type";

export const clarityChatConfigs: Record<string, ChatConfig> = {
  clarityGeneralChat,
  clarityDoctorExplained,
  clarityExplainMedication,
  clarityExplainEveryday,
  clarityAppointmentPrep,
  claritySummariseDocument,
};
