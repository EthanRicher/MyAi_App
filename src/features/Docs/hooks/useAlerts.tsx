import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DistressTier } from "../../../backend/_AI/AI_DistressGuard";

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
  severity: AlertSeverity;  // "high" when a keyword matched or the AI tier was red; "medium" when only AI phrase-level flagged it.
  distressTier?: DistressTier; // Stored so the alerts log can colour distress signals red separately from blue trigger-keyword entries.
  storageKey: string;       // Which chat the alert came from.
  timestamp: string;        // ISO timestamp.
};

type AlertsContextType = {
  alerts: AlertEntry[];
  addAlert: (a: {
    message: string;
    keywords: string[];
    reason?: string;
    storageKey: string;
    distressTier?: DistressTier;
  }) => void;
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

  // Load + migrate. Older entries pre-date both the severity field
  // and the distressTier field; backfill both from the data we have.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as any[];
          const migrated: AlertEntry[] = parsed.map((a) => {
            const hasKeywords = Array.isArray(a.keywords) && a.keywords.length > 0;
            const severity: AlertSeverity = a.severity ?? (hasKeywords ? "high" : "medium");
            // Best-effort tier inference: a "high"-severity entry with
            // NO keywords must have been a hardcoded distress RED, so
            // mark it as such. Entries with keywords stay
            // distressTier-less and render as blue trigger alerts.
            const distressTier: DistressTier | undefined =
              a.distressTier ?? (severity === "high" && !hasKeywords ? "red" : undefined);
            return { ...a, severity, distressTier };
          });
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
   * Severity is the highest tier any signal raised this turn:
   * - "high" (red) when a hardcoded keyword matched OR the AI's
   *   final distress tier was RED.
   * - "medium" (orange) when only the AI second-pass flagged the
   *   phrasing OR the AI's final tier was AMBER.
   * Keeps the Alerts log consistent with the chat-bubble chip — if
   * the user saw a red chip on screen, the carer sees a red entry
   * in the log.
   */
  const addAlert: AlertsContextType["addAlert"] = ({ message, keywords, reason, storageKey, distressTier }) => {
    const severity: AlertSeverity =
      keywords.length > 0 || distressTier === "red" ? "high" : "medium";
    const entry: AlertEntry = {
      id: Date.now().toString() + ":" + Math.random().toString(36).slice(2, 6),
      message,
      keywords,
      reason,
      severity,
      distressTier,
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
