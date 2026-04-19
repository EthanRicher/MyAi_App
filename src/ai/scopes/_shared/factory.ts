import type { AIScope } from "../../core/types";
import { buildSharedPrompt, buildSharedPhotoPrompt } from "./formats";

// Infer whether a response needs structured breakdown or a plain conversational reply
export const inferFormat = (input: string): "breakdown" | "conversational" => {
  const words = input.trim().split(/\s+/).length;
  if (words > 50) return "breakdown";
  const conversational = /^(yes|no|ok|okay|sure|thanks|thank you|tell me|go on|and|but|i see|i understand|what about|how about|please|more)\b/i;
  if (conversational.test(input.trim()) && words < 15) return "conversational";
  if (words < 20) return "conversational";
  return "breakdown";
};

export type ScopeConfig = {
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
  topic: config.topic,
  warning: config.warning,
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
