export type AIDebugEntry = {
  id: string;
  time: string;
  source: string;
  label: string;
  payload: any;
};

export const AI_DEBUG = false;

let entries: AIDebugEntry[] = [];
const listeners = new Set<(entries: AIDebugEntry[]) => void>();

const notify = () => {
  const snapshot = [...entries];
  listeners.forEach((listener) => listener(snapshot));
};

export const addDebugEntry = (
  source: string,
  label: string,
  payload: any
) => {
  if (!AI_DEBUG) return;

  const entry: AIDebugEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    time: new Date().toLocaleTimeString(),
    source,
    label,
    payload,
  };

  entries = [entry, ...entries].slice(0, 100);
  notify();

  try {
    console.log(`[AI DEBUG] ${source} :: ${label}`, payload);
  } catch {}
};

export const clearDebugEntries = () => {
  entries = [];
  notify();
};

export const getDebugEntries = () => {
  return [...entries];
};

export const subscribeDebugEntries = (
  listener: (entries: AIDebugEntry[]) => void
) => {
  listeners.add(listener);
  listener([...entries]);

  return () => {
    listeners.delete(listener);
  };
};