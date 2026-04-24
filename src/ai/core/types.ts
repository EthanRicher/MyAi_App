export type AIResponseFormat = "text" | "json";

export type AIScope = {
  id: string;
  conversational?: boolean;
  buildPrompt: (text: string) => string;
  /**
   * Optional: dedicated prompt builder for photo input.
   * Receives the vision/OCR analysis of the image.
   * If omitted, falls back to buildPrompt(analysis).
   */
  buildPhotoPrompt?: (analysis: string) => string;
  mapOutput?: (parsed: any) => any;
  responseFormat?: AIResponseFormat;
  warning?: string;
  /**
   * Short description of what this scope does.
   * Used to generate specific off-topic / irrelevant-photo rejection messages.
   * e.g. "explain your medications"
   */
  topic?: string;
};

import type { BreakdownLength } from "../../config/breakdownSettings";

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