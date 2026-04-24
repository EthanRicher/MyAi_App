export const colors = {
  background: "#04041c",
  card: "#181848",
  primary: "#0dd9f7",
  border: "#4A4A5A",
  text: "#FFFFFF",
  textMuted: "#B0B0C0",
  textCaption: "#7A7A8E",
  destructive: "#E53935",
  green: "#4CAF50",
  orange: "#FF9800",
  purple: "#BB86FC",
  red: "#F44336",
  yellow: "#f59e0b",
} as const;

// Colors used by both chat bubbles and the fullscreen reader.
export const chatBubble = {
  ai: "#222268",
  user: colors.card,
} as const;

// Warning banner palette (shared by in-chat warnings and the fullscreen reader).
export const warningColors = {
  border: "#F9A825",
  translucentBg: "rgba(249,168,37,0.15)",
  deepBg: "#2A2000",
  text: "#FFD54F",
} as const;

// Colors for the record / type / photo action buttons at the bottom of chats.
// `record.active` is the darker shade shown while recording is in progress.
export const chatActionColors = {
  record: "#E53935",
  recordActive: "#b71c1c",
  type: "#FF9800",
  photo: "#00BCD4",
} as const;
