import { MessageCircle, Brain, Calendar, Heart, HelpCircle, BookOpen, Users, Mail, Bookmark, Palette } from "lucide-react-native";
import { colors } from "../../theme";

/**
 * Shared scaffolding for every Companion mode config plus the
 * landing-page card definitions. Per-mode files spread
 * COMPANION_DEFAULTS and override only what differs; the cards
 * power the two tabs on the Companion landing page.
 */

// Defaults every mode inherits. Each Chat_*.ts file overrides only the fields it needs.
export const COMPANION_DEFAULTS = {
  conversational: true,
  warning: undefined,             // Companion is not informational, so no AI warning banner.
  accentColor: colors.purple,
  aiLabel: "Companion AI",
  backTo: "Companion",
  backLabel: "Companion",
  speechEnabled: true,
  cameraEnabled: false,
  placeholder: "Tell me what's on your mind...",
  typingLabel: "Thinking...",
  errorMessage: "I'm sorry, I didn't quite catch that. Could you try again?",
  fallbackMessage: "I'm here — please tell me more.",
  speechErrorMessage: "I couldn't hear you. Could you say it again?",
};

// One landing card. Tapping it opens the chat with the corresponding mode and seed message.
export interface CompanionCard {
  title: string; // Card heading.
  desc: string;  // One-line description.
  icon: any;     // Lucide icon component.
  msg: string;   // First AI message (auto-prompt seed).
}

// Cards for the "Conversation" tab on the Companion landing page.
export const conversationCards: CompanionCard[] = [
  { title: "Chat", desc: "Friendly conversation", icon: MessageCircle, msg: "Hello! I'm so glad you're here. It's always nice to have someone to talk to. What's on your mind today?" },
  { title: "Brain Games", desc: "Trivia & teasers", icon: Brain, msg: "Let's give your mind a little workout! Would you like a fun fact, a gentle brain teaser, or to learn something new today?" },
  { title: "Plan My Day", desc: "Organise your day", icon: Calendar, msg: "Let's plan your day together! What do you have coming up today, or would you like me to suggest a balanced routine?" },
  { title: "Calm Down", desc: "Relaxation & breathing", icon: Heart, msg: "I'm here to help you feel calm and centred. Would you like to try a breathing exercise, or would you prefer to just talk about how you're feeling?" },
  { title: "Ask Anything", desc: "Tech, cooking, emails", icon: HelpCircle, msg: "I'm happy to help with anything! What would you like to know about? It could be technology, cooking, emails, or anything at all." },
];

// Cards for the "Stories" tab. Geared towards memory keeping and creative play.
export const storiesCards: CompanionCard[] = [
  { title: "Share Stories", desc: "Tell your stories", icon: BookOpen, msg: "I'd love to hear about your life! What's a favourite memory you'd like to share?" },
  { title: "Family Tree", desc: "Map your family", icon: Users, msg: "Let's build your family tree! Who would you like to start with? Tell me about your family members." },
  { title: "Write Letters", desc: "Express your feelings", icon: Mail, msg: "Writing letters to family is a wonderful way to share your feelings. Who would you like to write to today?" },
  { title: "Memory Book", desc: "Compile memories", icon: Bookmark, msg: "Let's turn your precious memories into a beautiful book. What's the first memory that comes to mind?" },
  { title: "Creative Corner", desc: "Poetry & art", icon: Palette, msg: "Let's get creative! Would you like to try writing a poem, describing a painting, or perhaps composing a short story?" },
];
