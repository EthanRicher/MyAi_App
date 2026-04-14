export type AIResponseFormat = "text" | "json";

export type AIScope = {
  id: string;
  conversational?: boolean;
  buildPrompt: (text: string) => string;
  mapOutput?: (parsed: any) => any;
  responseFormat?: AIResponseFormat;
};

export type RunAIArgs = {
  text: string;
  scope: AIScope;
};

export type RunAIResult = {
  raw?: string;
  parsed?: any;
  output?: any;
  error?: string;
};