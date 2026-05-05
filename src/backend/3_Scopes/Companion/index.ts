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
import { AIScope } from "../../_AI/AI_Types";

/**
 * Scope per Companion mode (matches the chat-config dispatch in
 * src/config/Companion/index.ts). The shared base task lives in
 * Scope_Common_Companion.ts; each Chat_*.ts only declares its
 * mode-specific behaviour on top of that.
 */
export const companionScopes = {
  "Brain Games": companionBrainGames,
  "Plan My Day": companionPlanMyDay,
  "Calm Down": companionCalmDown,
  "Ask Anything": companionAskAnything,
  "Share Stories": companionShareStories,
  "Family Tree": companionFamilyTree,
  "Write Letters": companionWriteLetters,
  "Memory Book": companionMemoryBook,
  "Creative Corner": companionCreativeCorner,
} as const;

export type CompanionMode = keyof typeof companionScopes;

// Pick the right scope for a Companion mode, falling back to the default chat.
export function getCompanionScope(mode?: string): AIScope {
  if (mode && mode in companionScopes) {
    return companionScopes[mode as CompanionMode];
  }
  return companionDefault;
}

export {
  companionDefault,
  companionBrainGames,
  companionPlanMyDay,
  companionCalmDown,
  companionAskAnything,
  companionShareStories,
  companionFamilyTree,
  companionWriteLetters,
  companionMemoryBook,
  companionCreativeCorner,
};
