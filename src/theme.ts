/**
 * Central palette for the whole app. Every screen, bubble, banner and
 * action button pulls its colours from here so the look stays
 * consistent and a single tweak rolls everywhere.
 */

// Core palette. The base background, card surface, brand primary, text shades, and a few accents.
export const colors = {
  background: "#04041c",  // App background.
  card: "#181848",        // Card / surface colour.
  primary: "#0dd9f7",     // Brand cyan.
  border: "#4A4A5A",      // Hairline borders.
  text: "#FFFFFF",        // Default body text.
  textMuted: "#B0B0C0",   // Secondary labels and captions.
  textCaption: "#7A7A8E", // Tertiary fine-print text.
  destructive: "#E53935", // Errors and destructive actions.
  green: "#4CAF50",       // Success / positive cues.
  orange: "#FF9800",      // Soft warnings and AI-only flags.
  purple: "#BB86FC",      // Accent for special features.
} as const;

// Bubble background colours used in the chat and the fullscreen reader.
export const chatBubble = {
  ai: "#222268",     // AI bubble background.
  user: colors.card, // User bubble background (matches the card colour).
} as const;

// Warning banner palette shared by in-chat warnings and the fullscreen reader.
export const warningColors = {
  border: "#F9A825",                     // Banner border.
  translucentBg: "rgba(249,168,37,0.15)",// Light overlay used for translucent backdrops.
  deepBg: "#2A2000",                     // Dark fill used inside bubbles.
  text: "#FFD54F",                       // Warning copy colour.
} as const;

/**
 * Colours for the record / type / photo action buttons at the bottom
 * of chats. recordActive is the darker shade shown while recording is
 * in progress.
 */
export const chatActionColors = {
  record: "#E53935",        // Idle record button.
  recordActive: "#b71c1c",  // Darker shade while the mic is hot.
  type: "#FF9800",          // Type button.
  photo: "#00BCD4",         // Photo button.
} as const;
