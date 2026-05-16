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
import { DocCategory } from "../../../features/Docs/models/Doc";
import { FAMILY_CONTEXT_HEADING, MEMORY_CONTEXT_HEADING } from "./Chat_CompanionBase";

/**
 * Scope per Companion mode (matches the chat-config dispatch in
 * src/config/Companion/index.ts). The shared base task lives in
 * Chat_CompanionBase.ts; each Chat_*.ts only declares its
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

/**
 * Modes that want existing saved docs injected as context on every
 * turn (so the scope can recognise people / memories across turns).
 * Keys are the same mode names used in `companionScopes`. When a
 * mode is renamed or added, update this table — the screen now
 * looks up its context wiring through `getCompanionModeContext`
 * instead of duplicating the dispatch.
 */
const COMPANION_MODE_CONTEXT: Partial<
  Record<CompanionMode, { heading: string; docCategory: DocCategory }>
> = {
  "Family Tree": {
    heading: `${FAMILY_CONTEXT_HEADING} (use these to recognise people across turns):`,
    docCategory: "family",
  },
  "Memory Book": {
    heading: `${MEMORY_CONTEXT_HEADING} (use these to recognise the memory across turns):`,
    docCategory: "memory",
  },
};

// Returns the context-injection wiring for a mode, or undefined if
// the mode doesn't pull in any existing docs.
export function getCompanionModeContext(mode?: string) {
  if (mode && mode in COMPANION_MODE_CONTEXT) {
    return COMPANION_MODE_CONTEXT[mode as CompanionMode];
  }
  return undefined;
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
