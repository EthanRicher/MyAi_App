import type { ChatConfig } from "../_Common/ChatConfig_Type";
import { COMPANION_DEFAULTS } from "./_Companion_Config";

export const companionAskAnything: ChatConfig = {
  ...COMPANION_DEFAULTS,
  title: "Ask Anything",
  disclaimer: "Ask me anything — tech, cooking, emails",
  starterPrompts: ["What's a good recipe for soup?", "How do I write a good email?", "Explain how Wi-Fi works"],
};
