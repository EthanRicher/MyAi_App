import { companionDefault } from "./Chat_Default";
import { companionBrainGames } from "./Chat_BrainGames";
import { companionPlanMyDay } from "./Chat_PlanMyDay";
import { companionCalmDown } from "./Chat_CalmDown";
import { companionAskAnything } from "./Chat_AskAnything";
import { companionShareStories } from "./Chat_ShareStories";
import { companionFamilyTree } from "./Chat_FamilyTree";
import { companionWriteLetters } from "./Chat_WriteLetters";
import { companionMemoryBook } from "./Chat_MemoryBook";
import { companionCreativeCorner } from "./Chat_CreativeCorner";
import type { ChatConfig } from "../_Common/ChatConfig_Type";

/**
 * Companion mode dispatcher. The Companion landing page passes a
 * mode string through navigation params; CompanionChat uses
 * getCompanionChatConfig to pull the matching config (or the
 * default open-chat config when nothing matches).
 */

const companionChatConfigs: Record<string, ChatConfig> = {
  default: companionDefault,
  "Brain Games": companionBrainGames,
  "Plan My Day": companionPlanMyDay,
  "Calm Down": companionCalmDown,
  "Ask Anything": companionAskAnything,
  "Share Stories": companionShareStories,
  "Family Tree": companionFamilyTree,
  "Write Letters": companionWriteLetters,
  "Memory Book": companionMemoryBook,
  "Creative Corner": companionCreativeCorner,
};

// Pick the right config for a Companion mode, falling back to the open-chat default.
export const getCompanionChatConfig = (mode?: string): ChatConfig =>
  (mode && companionChatConfigs[mode]) || companionChatConfigs.default;
