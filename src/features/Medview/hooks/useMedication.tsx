import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medication } from "../models/Medication";

/**
 * Medications context. Backs MedView: add / update / delete entries,
 * tick off doses for the day, and persists everything in
 * AsyncStorage. Includes a small migration on load so older entries
 * still work after the schema gained per-dose taken state.
 */

type MedicationContextType = {
  medications: Medication[];
  addMed: (med: Omit<Medication, "id" | "taken">) => void;
  updateMed: (med: Medication) => void;
  deleteMed: (id: string) => void;
  clearMeds: () => void;
  toggleTaken: (id: string, index: number) => void;
  getMed: (id: string) => Medication | undefined;
};

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMed: () => {},
  updateMed: () => {},
  deleteMed: () => {},
  clearMeds: () => {},
  toggleTaken: () => {},
  getMed: () => undefined,
});

const STORAGE_KEY = "MEDICATIONS";

export function MedicationProvider({ children }: { children: ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);

  // Load + light migration. Older saves missed `image` / `times` / `taken` so backfill defaults.
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);

          const fixed = parsed.map((m: any) => ({
            ...m,
            image: m.image ?? null,
            times: m.times || [],
            taken: m.taken || Array((m.times || []).length).fill(false),
          }));

          setMedications(fixed);
        }
      } catch {}
    };
    load();
  }, []);

  // Persist on every change.
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
  }, [medications]);

  const addMed = (med: Omit<Medication, "id" | "taken">) => {
    const newMed: Medication = {
      id: Date.now().toString(),
      taken: Array(med.times.length).fill(false),
      image: med.image ?? null,
      ...med,
    };
    setMedications((prev) => [...prev, newMed]);
  };

  const updateMed = (updatedMed: Medication) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === updatedMed.id ? updatedMed : m))
    );
  };

  const deleteMed = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const clearMeds = () => {
    setMedications([]);
  };

  // Flip the taken state for one dose of one medication.
  const toggleTaken = (id: string, index: number) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              taken: m.taken.map((t, i) => (i === index ? !t : t)),
            }
          : m
      )
    );
  };

  const getMed = (id: string) => {
    return medications.find((m) => m.id === id);
  };

  return (
    <MedicationContext.Provider
      value={{ medications, addMed, updateMed, deleteMed, clearMeds, toggleTaken, getMed }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedications() {
  return useContext(MedicationContext);
}
