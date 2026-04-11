import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Medication } from "../models/Medication";

type MedicationContextType = {
  medications: Medication[];
  addMed: (med: Omit<Medication, "id" | "taken">) => void;
  deleteMed: (id: string) => void;
  toggleTaken: (id: string) => void;
  getMed: (id: string) => Medication | undefined;
};

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMed: () => {},
  deleteMed: () => {},
  toggleTaken: () => {},
  getMed: () => undefined,
});

const STORAGE_KEY = "MEDICATIONS";

type Props = {
  children: ReactNode;
};

export function MedicationProvider({ children }: Props) {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          setMedications(JSON.parse(data));
        }
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
      } catch {}
    };
    save();
  }, [medications]);

  const addMed = (med: Omit<Medication, "id" | "taken">) => {
    const newMed: Medication = {
      id: Date.now().toString(),
      taken: false,
      ...med,
    };
    setMedications((prev) => [...prev, newMed]);
  };

  const deleteMed = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleTaken = (id: string) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, taken: !m.taken } : m
      )
    );
  };

  const getMed = (id: string) => {
    return medications.find((m) => m.id === id);
  };

  return (
    <MedicationContext.Provider
      value={{ medications, addMed, deleteMed, toggleTaken, getMed }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedications() {
  return useContext(MedicationContext);
}