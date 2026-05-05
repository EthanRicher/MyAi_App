/**
 * Doc model. Anything saved into the Docs library (letters, plans,
 * family records, memories, etc.) is stored as a Doc with a category
 * tag. Categories drive the filtering, the icon, and where the doc
 * surfaces inside each feature group.
 */

// Tag for which feature / save-flow this doc came from.
export type DocCategory =
  | "letter"
  | "plan"
  | "family"
  | "memory"
  | "summary"
  | "doctor"
  | "appointment";

// One stored doc.
export type Doc = {
  id: string;            // Unique id (timestamp string).
  title: string;         // User-visible title.
  category: DocCategory; // Bucket the doc belongs to.
  content: string;       // The body text. Plain text or markdown.
  createdAt: string;     // ISO date when first saved.
  updatedAt: string;     // ISO date of the last update.
};

// Human labels for each category. Used in headings and category cards.
export const CATEGORY_LABELS: Record<DocCategory, string> = {
  letter: "Letters",
  plan: "Plans",
  family: "Family",
  memory: "Memories",
  summary: "Summaries",
  doctor: "Doctor Explained",
  appointment: "Appointment Prep",
};

/**
 * Order matches the Companion + Clarity landing menus so anywhere a
 * flat category list is shown reads in the same sequence as the
 * source feature.
 */
export const CATEGORY_ORDER: DocCategory[] = [
  "plan",
  "family",
  "letter",
  "memory",
  "doctor",
  "summary",
  "appointment",
];
