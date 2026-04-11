export type Medication = {
  id: string;
  name: string;
  dose: string;
  time: "Morning" | "Afternoon" | "Evening";
  taken: boolean;

  type?: string;
  notes?: string;
  schedule?: string;
};