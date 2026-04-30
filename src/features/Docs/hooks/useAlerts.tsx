import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AlertEntry = {
  id: string;
  message: string;        // the user's full message
  keywords: string[];     // matched red-flag keywords (hardcoded list)
  reason?: string;        // AI second-pass reason when no hard match exists, or alongside it
  storageKey: string;     // which chat the alert came from
  timestamp: string;      // ISO
};

type AlertsContextType = {
  alerts: AlertEntry[];
  addAlert: (a: { message: string; keywords: string[]; reason?: string; storageKey: string }) => void;
  clearAlerts: () => void;
};

const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  addAlert: () => {},
  clearAlerts: () => {},
});

const STORAGE_KEY = "ALERTS";

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setAlerts(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts, loaded]);

  const addAlert: AlertsContextType["addAlert"] = ({ message, keywords, reason, storageKey }) => {
    const entry: AlertEntry = {
      id: Date.now().toString() + ":" + Math.random().toString(36).slice(2, 6),
      message,
      keywords,
      reason,
      storageKey,
      timestamp: new Date().toISOString(),
    };
    setAlerts((prev) => [entry, ...prev]);
  };

  const clearAlerts = () => setAlerts([]);

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, clearAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}
