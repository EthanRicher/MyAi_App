/**
 * Medication record stored in MedView. One per medication the user
 * is taking, with the daily schedule and per-dose taken status.
 */
export type Medication = {
  id: string;            // Unique id (timestamp string).

  name: string;          // Medication name (e.g. "Atorvastatin").
  dose: string;          // Dose per intake (e.g. "20mg").
  description: string;   // Plain-English usage notes shown on the detail screen.

  dosesPerDay: number;   // How many times the medication is taken in a day.
  times: string[];       // HH:MM strings, one per dose.

  taken: boolean[];      // Tick state for today's doses; index matches `times`.

  image?: string | null; // Optional photo of the label / packet.
};
