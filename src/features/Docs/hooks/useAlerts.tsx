import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Alerts context. Every time a chat message trips the keyword
 * scanner or the AI second-pass, an entry gets logged here so the
 * Docs/Alerts screen can show it to the carer. Persists in
 * AsyncStorage and supports a light migration for older entries
 * that pre-date the severity field.
 */

export type AlertSeverity = "high" | "medium";

// One alert entry shown to the carer.
export type AlertEntry = {
  id: string;
  message: string;          // The user's full message that tripped the alert.
  keywords: string[];       // Matched red-flag keywords (hardcoded list).
  reason?: string;          // AI second-pass reason when no hard match exists, or alongside it.
  severity: AlertSeverity;  // "high" when a keyword matched, "medium" when only AI flagged.
  storageKey: string;       // Which chat the alert came from.
  timestamp: string;        // ISO timestamp.
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

  // Load + migrate. Older entries didn't have a severity field; backfill from the keyword count.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as any[];
          const migrated: AlertEntry[] = parsed.map((a) => ({
            ...a,
            severity: a.severity ?? (Array.isArray(a.keywords) && a.keywords.length > 0 ? "high" : "medium"),
          }));
          setAlerts(migrated);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Write through whenever alerts change. Skipped until the initial load has settled.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts, loaded]);

  /**
   * Hardcoded keyword match → "high" (red). AI-only phrasing flag
   * → "medium" (orange). The keyword list is unambiguous; the AI
   * pass catches paraphrase / context the word list misses, a
   * softer signal that still warrants carer review.
   */
  const addAlert: AlertsContextType["addAlert"] = ({ message, keywords, reason, storageKey }) => {
    const severity: AlertSeverity = keywords.length > 0 ? "high" : "medium";
    const entry: AlertEntry = {
      id: Date.now().toString() + ":" + Math.random().toString(36).slice(2, 6),
      message,
      keywords,
      reason,
      severity,
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
