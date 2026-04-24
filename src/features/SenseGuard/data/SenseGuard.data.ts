export interface Mood {
  label: string;
  color: string;
  emoji: string;
}

export const moods: Mood[] = [
  { label: "Great", color: "#4CAF50", emoji: "😄" },
  { label: "OK", color: "#8BC34A", emoji: "🙂" },
  { label: "Low", color: "#FF9800", emoji: "😔" },
  { label: "Worried", color: "#FF5722", emoji: "😟" },
  { label: "Struggling", color: "#F44336", emoji: "😢" },
];
