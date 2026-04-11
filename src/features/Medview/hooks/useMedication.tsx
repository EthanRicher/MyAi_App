import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medication } from "../models/Medication";

type MedicationContextType = {
  medications: Medication[];
  addMed: (med: Omit<Medication, "id" | "taken">) => void;
  updateMed: (med: Medication) => void;
  deleteMed: (id: string) => void;
  toggleTaken: (id: string, index: number) => void;
  getMed: (id: string) => Medication | undefined;
};

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMed: () => {},
  updateMed: () => {},
  deleteMed: () => {},
  toggleTaken: () => {},
  getMed: () => undefined,
});

const STORAGE_KEY = "MEDICATIONS";

export function MedicationProvider({ children }: { children: ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);

          const fixed = parsed.map((m: any) => ({
            ...m,
            times: m.times || [],
            taken: m.taken || Array((m.times || []).length).fill(false),
          }));

          setMedications(fixed);
        }
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
  }, [medications]);

  const addMed = (med: Omit<Medication, "id" | "taken">) => {
    const newMed: Medication = {
      id: Date.now().toString(),
      taken: Array(med.times.length).fill(false),
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

  const toggleTaken = (id: string, index: number) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              taken: m.taken.map((t, i) =>
                i === index ? !t : t
              ),
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
      value={{ medications, addMed, updateMed, deleteMed, toggleTaken, getMed }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedications() {
  return useContext(MedicationContext);
}