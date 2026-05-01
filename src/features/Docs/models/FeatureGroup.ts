import { Brain, Search, Pill, Heart, Shield } from "lucide-react-native";
import { DocCategory } from "./Doc";

export type FeatureGroupId = "companion" | "clarity" | "medview" | "senseguard" | "safeharbour";

export type FeatureGroup = {
  id: FeatureGroupId;
  label: string;
  icon: any;
  color: string;
  categories: DocCategory[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "companion",
    label: "Companion",
    icon: Brain,
    color: "#BB86FC",
    // Match the order shown on the Companion landing menu: Plan My Day
    // appears in the Conversation tab; Family Tree → Write Letters →
    // Memory Book are sequential in the Stories tab.
    categories: ["plan", "family", "letter", "memory"],
  },
  {
    id: "clarity",
    label: "Clarity",
    icon: Search,
    color: "#0dd9f7",
    // Match the order on the Clarity landing menu: Doctor Explained →
    // Summarise Document → Appointment Prep.
    categories: ["doctor", "summary", "appointment"],
  },
  {
    id: "medview",
    label: "MedView",
    icon: Pill,
    color: "#4CAF50",
    categories: [],
  },
  {
    id: "senseguard",
    label: "SenseGuard",
    icon: Heart,
    color: "#F472B6",
    categories: [],
  },
  {
    id: "safeharbour",
    label: "SafeHarbour",
    icon: Shield,
    color: "#F44336",
    categories: [],
  },
];

export const getFeatureGroup = (id: FeatureGroupId): FeatureGroup | undefined =>
  FEATURE_GROUPS.find((g) => g.id === id);
