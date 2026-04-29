export type DocCategory =
  | "letter"
  | "plan"
  | "family"
  | "memory"
  | "summary"
  | "general";

export type Doc = {
  id: string;
  title: string;
  category: DocCategory;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_LABELS: Record<DocCategory, string> = {
  letter: "Letters",
  plan: "Plans",
  family: "Family",
  memory: "Memories",
  summary: "Summaries",
  general: "Notes",
};

export const CATEGORY_ORDER: DocCategory[] = [
  "letter",
  "plan",
  "family",
  "memory",
  "summary",
  "general",
];
