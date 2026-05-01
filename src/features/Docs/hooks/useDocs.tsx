import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Doc, DocCategory } from "../models/Doc";

type DocsContextType = {
  docs: Doc[];
  addDoc: (d: { title: string; category: DocCategory; content: string }) => Doc;
  upsertDocByTitle: (d: { title: string; category: DocCategory; content: string }) => Doc;
  updateDoc: (doc: Doc) => void;
  deleteDoc: (id: string) => void;
  getDoc: (id: string) => Doc | undefined;
};

const DocsContext = createContext<DocsContextType>({
  docs: [],
  addDoc: () => ({ id: "", title: "", category: "letter", content: "", createdAt: "", updatedAt: "" }),
  upsertDocByTitle: () => ({ id: "", title: "", category: "letter", content: "", createdAt: "", updatedAt: "" }),
  updateDoc: () => {},
  deleteDoc: () => {},
  getDoc: () => undefined,
});

const STORAGE_KEY = "DOCS";

export function DocsProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setDocs(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }, [docs, loaded]);

  const addDoc: DocsContextType["addDoc"] = ({ title, category, content }) => {
    const now = new Date().toISOString();
    const doc: Doc = {
      id: Date.now().toString(),
      title: title.trim() || "Untitled",
      category,
      content,
      createdAt: now,
      updatedAt: now,
    };
    setDocs((prev) => [doc, ...prev]);
    return doc;
  };

  // Replaces the doc when a same-title (case-insensitive) doc already exists
  // in the same category — used for family-tree saves where the AI re-emits
  // the full updated person record each time.
  const upsertDocByTitle: DocsContextType["upsertDocByTitle"] = ({ title, category, content }) => {
    const normalised = title.trim();
    const key = normalised.toLowerCase();
    const now = new Date().toISOString();
    const existing = docs.find(
      (d) => d.category === category && d.title.trim().toLowerCase() === key
    );
    if (existing) {
      const updated: Doc = { ...existing, title: normalised || existing.title, content, updatedAt: now };
      setDocs((prev) => prev.map((d) => (d.id === existing.id ? updated : d)));
      return updated;
    }
    return addDoc({ title: normalised, category, content });
  };

  const updateDoc = (updated: Doc) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : d))
    );
  };

  const deleteDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const getDoc = (id: string) => docs.find((d) => d.id === id);

  return (
    <DocsContext.Provider value={{ docs, addDoc, upsertDocByTitle, updateDoc, deleteDoc, getDoc }}>
      {children}
    </DocsContext.Provider>
  );
}

export function useDocs() {
  return useContext(DocsContext);
}
