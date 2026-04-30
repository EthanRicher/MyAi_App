import type { AIScope } from "../../4_AI/AI_Types";
import { buildSharedPrompt, buildSharedPhotoPrompt } from "./Scope_Common_Formats";

type ScopeConfig = {
  id: string;
  topic: string;
  warning?: string;
  format?: "breakdown" | "conversational" | "auto";
  task: string;
  photoTask?: string;
  mapOutput?: (parsed: any) => any;
  responseFormat?: "text" | "json";
};

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

  buildPrompt: (input: string) =>
    buildSharedPrompt(
      `${config.task}\n\nINPUT:\n${input}`,
      resolveFormat(config),
      config.topic
    ),

  buildPhotoPrompt: config.photoTask
    ? (analysis: string) =>
        buildSharedPhotoPrompt(
          `${config.photoTask}\n\nVISUAL ANALYSIS:\n${analysis}`,
          "breakdown",
          config.topic
        )
    : undefined,
});
