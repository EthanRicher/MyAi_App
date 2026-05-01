export type DocCategory =
  | "letter"
  | "plan"
  | "family"
  | "memory"
  | "summary"
  | "doctor"
  | "appointment";

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
  doctor: "Doctor Explained",
  appointment: "Appointment Prep",
};

// Order matches the Companion + Clarity landing menus so anywhere a flat
// category list is shown reads in the same sequence as the source feature.
export const CATEGORY_ORDER: DocCategory[] = [
  "plan",
  "family",
  "letter",
  "memory",
  "doctor",
  "summary",
  "appointment",
];
