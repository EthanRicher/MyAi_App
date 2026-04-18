import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "settings:ai";

export type AISettings = {
  saveChatHistory: boolean;
  useHistory: boolean;
  clearOnExit: boolean;
};

const DEFAULTS: AISettings = {
  saveChatHistory: true,
  useHistory: true,
  clearOnExit: false,
};

export async function loadAISettings(): Promise<AISettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export async function saveAISettings(settings: AISettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadAISettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = async (patch: Partial<AISettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveAISettings(next);
  };

  return { settings, loaded, update };
}
