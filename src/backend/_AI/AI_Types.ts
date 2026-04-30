type AIResponseFormat = "text" | "json";

export type AIScope = {
  id: string;
  buildPrompt: (text: string) => string;
  /**
   * Optional: prompt builder for the very first turn when the screen is
   * opened with a contextual seed (e.g. a medication record). Receives that
   * seed and returns a fully-formed prompt; ignored on subsequent turns.
   */
  buildInitialPrompt?: (seed: any) => string;
  /**
   * Optional: dedicated prompt builder for photo input.
   * Receives the vision/OCR analysis of the image.
   * If omitted, falls back to buildPrompt(analysis).
   */
  buildPhotoPrompt?: (analysis: string) => string;
  mapOutput?: (parsed: any) => any;
  responseFormat?: AIResponseFormat;
};

import type { BreakdownLength } from "../../config/Config_General";

export type RunAIArgs = {
  text: string;
  scope: AIScope;
  breakdownLength?: BreakdownLength;
};

export type RunAIResult = {
  raw?: string;
  parsed?: any;
  output?: any;
  error?: string;
};