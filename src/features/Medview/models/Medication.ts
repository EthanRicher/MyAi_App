export type Medication = {
  id: string;

  name: string;
  dose: string;
  description: string;

  dosesPerDay: number;
  times: string[];

  taken: boolean[];
};