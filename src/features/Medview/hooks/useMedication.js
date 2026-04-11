import { useState, useContext, createContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MedicationContext = createContext();

const STORAGE_KEY = "MEDICATIONS";

export function MedicationProvider({ children }) {
  const [medications, setMedications] = useState([]);

  
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          setMedications(JSON.parse(data));
        }
      } catch (e) {
        console.log("LOAD ERROR", e);
      }
    };
    load();
  }, []);

 
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
      } catch (e) {
        console.log("SAVE ERROR", e);
      }
    };
    save();
  }, [medications]);

  
  const addMed = (med) => {
    const newMed = {
      id: Date.now().toString(),
      taken: false,
      ...med,
    };
    setMedications((prev) => [...prev, newMed]);
  };

  
  const deleteMed = (id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  
  const toggleTaken = (id) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, taken: !m.taken } : m
      )
    );
  };

  
  const getMed = (id) => {
    return medications.find((m) => m.id === id);
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        addMed,
        deleteMed,
        toggleTaken,
        getMed,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedications() {
  const context = useContext(MedicationContext);
  if (!context) throw new Error("Wrap app in MedicationProvider");
  return context;
}