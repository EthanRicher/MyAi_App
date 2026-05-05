import type { AIScope } from "../../_AI/AI_Types";
import { buildSharedPrompt, buildSharedPhotoPrompt } from "./Scope_Common_Formats";

/**
 * Factory that turns a small ScopeConfig into a full AIScope. Saves
 * every chat scope from copy-pasting the same prompt scaffolding
 * (rules, format block, INPUT marker, photo prompt) over and over.
 */

type ScopeConfig = {
  id: string;                                              // Stable identifier used in debug logs.
  topic: string;                                           // Short on-topic blurb, used for off-topic / off-photo replies.
  warning?: string;                                        // Optional scope-specific warning copy.
  format?: "breakdown" | "conversational" | "auto";        // Shape of the reply (defaults to breakdown).
  task: string;                                            // Task description injected into the prompt.
  photoTask?: string;                                      // Same as task but for photo input; enables buildPhotoPrompt.
  mapOutput?: (parsed: any) => any;                        // Optional post-processing on the parsed AI output.
  responseFormat?: "text" | "json";                        // "json" tells the model to return strict JSON.
};

// Pick the shape of the response. Falls back to breakdown when nothing's set.
const resolveFormat = (
  config: ScopeConfig,
): "breakdown" | "conversational" | "auto" => {
  if (config.format) return config.format;
  return "breakdown";
};

export const createScope = (config: ScopeConfig): AIScope => ({
  id: config.id,
  responseFormat: config.responseFormat,
  mapOutput: config.mapOutput,

  // Standard text prompt. Wraps the task with the shared rules + format block.
  buildPrompt: (input: string) =>
    buildSharedPrompt(
      `${config.task}\n\nINPUT:\n${input}`,
      resolveFormat(config),
      config.topic
    ),

  // Photo prompt. Only attached when the scope opted in by providing photoTask.
  buildPhotoPrompt: config.photoTask
    ? (analysis: string) =>
        buildSharedPhotoPrompt(
          `${config.photoTask}\n\nVISUAL ANALYSIS:\n${analysis}`,
          "breakdown",
          config.topic
        )
    : undefined,
});
