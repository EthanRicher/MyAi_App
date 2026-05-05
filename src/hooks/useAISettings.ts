import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persisted AI-related preferences. Whether to keep chat history,
 * whether the AI sees that history, whether to wipe on exit, etc.
 * Loaded from AsyncStorage on mount and written through whenever
 * something changes.
 */

const STORAGE_KEY = "settings:ai";

export type AISettings = {
  saveChatHistory: boolean;     // Persist chat transcripts to disk.
  useHistory: boolean;          // Pass prior turns into the AI for context.
  clearOnExit: boolean;         // Wipe transcripts when the chat closes.
  showStarterPrompts: boolean;  // Show suggestion chips on empty chats.
  defaultLanguage: "English";   // App-wide default language.
};

const DEFAULTS: AISettings = {
  saveChatHistory: true,
  useHistory: true,
  clearOnExit: false,
  showStarterPrompts: true,
  defaultLanguage: "English",
};

// Read settings from disk and merge them onto the defaults so new fields don't break old saves.
async function loadAISettings(): Promise<AISettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

async function saveAISettings(settings: AISettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULTS);

  // Load saved settings once on mount.
  useEffect(() => {
    loadAISettings().then((s) => {
      setSettings(s);
    });
  }, []);

  // Update one or more fields and write the result straight back to disk.
  const update = async (patch: Partial<AISettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveAISettings(next);
  };

  return { settings, update };
}
