import type { BreakdownLength } from "../../config/Config_General";

/**
 * Shared types for the main AI pipeline. Defines what a "scope" looks
 * like (the per-feature prompt builder) and what the runAI helper
 * takes in and gives back.
 */

type AIResponseFormat = "text" | "json";

// One AI scope. Each chat / feature has its own scope with a tailored prompt.
export type AIScope = {
  id: string;                                 // Stable identifier used in debug logs.
  buildPrompt: (text: string) => string;      // Build the prompt for a normal user turn.
  /**
   * Optional prompt builder for the very first turn when the screen
   * is opened with a contextual seed (e.g. a medication record).
   * Receives that seed and returns a fully formed prompt; ignored on
   * subsequent turns.
   */
  buildInitialPrompt?: (seed: any) => string;
  /**
   * Optional dedicated prompt builder for photo input. Receives the
   * vision / OCR analysis of the image. If omitted, falls back to
   * buildPrompt(analysis).
   */
  buildPhotoPrompt?: (analysis: string) => string;
  mapOutput?: (parsed: any) => any;           // Optional post-processing of the parsed AI output.
  responseFormat?: AIResponseFormat;          // "json" tells the model to return strict JSON.
};

// Args passed into runAI for a single turn.
export type RunAIArgs = {
  text: string;                       // The user input (already cleaned).
  scope: AIScope;                     // The scope to run.
  breakdownLength?: BreakdownLength;  // Length cap for the reply.
};

// What runAI returns.
export type RunAIResult = {
  raw?: string;    // Full raw text from the model.
  parsed?: any;    // Parsed JSON or structured fields.
  output?: any;    // Result of scope.mapOutput, if defined.
  error?: string;  // Error message when the call failed.
};
