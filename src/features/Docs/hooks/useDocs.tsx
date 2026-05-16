import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Doc, DocCategory } from "../models/Doc";

/**
 * Docs context. Backs the Docs library: add / update / delete / read
 * docs, plus an upsert-by-title path for the passive Family + Memory
 * flows where the AI re-emits the full updated record each time.
 */

type UpsertResult = { doc: Doc; created: boolean };

type DocsContextType = {
  docs: Doc[];
  addDoc: (d: { title: string; category: DocCategory; content: string }) => Doc;
  upsertDocByTitle: (d: { title: string; category: DocCategory; content: string }) => UpsertResult;
  updateDoc: (doc: Doc) => void;
  deleteDoc: (id: string) => void;
  getDoc: (id: string) => Doc | undefined;
  clearDocs: () => void;
};

const EMPTY_DOC: Doc = { id: "", title: "", category: "letter", content: "", createdAt: "", updatedAt: "" };

const DocsContext = createContext<DocsContextType>({
  docs: [],
  addDoc: () => EMPTY_DOC,
  upsertDocByTitle: () => ({ doc: EMPTY_DOC, created: false }),
  updateDoc: () => {},
  deleteDoc: () => {},
  getDoc: () => undefined,
  clearDocs: () => {},
});

const STORAGE_KEY = "DOCS";

/**
 * Build a match key for upsert-by-title. The same conceptual title
 * can come back from the AI with cosmetic variations across turns
 * (em-dash vs hyphen, smart quotes, extra spaces, different unicode
 * composition); we collapse all of those so they hit the same entry.
 */
const normaliseTitleKey = (title: string): string =>
  title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")    // various dash codepoints → ASCII hyphen
    .replace(/[‘’‚‛]/g, "'") // smart single quotes → '
    .replace(/[“”„‟]/g, '"') // smart double quotes → "
    .replace(/\s+/g, " ")
    .trim();

export function DocsProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved docs from disk.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setDocs(JSON.parse(raw));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Write through whenever the doc list changes. Skipped until the initial load has settled.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }, [docs, loaded]);

  // Add a new doc to the front of the list.
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

  /**
   * Replaces the doc when a same-title doc already exists in the
   * same category. Used for family-tree / memory-book saves where
   * the AI re-emits the full updated record each turn.
   *
   * Title matching is normalised so cosmetic drift between two emits
   * of "the same" title (em-dash vs hyphen, smart vs straight quotes,
   * collapsing internal whitespace, NFKC unicode composition, case)
   * still hits the existing entry instead of creating a duplicate.
   */
  const upsertDocByTitle: DocsContextType["upsertDocByTitle"] = ({ title, category, content }) => {
    const normalised = title.trim();
    const key = normaliseTitleKey(normalised);
    const now = new Date().toISOString();
    const existing = docs.find(
      (d) => d.category === category && normaliseTitleKey(d.title) === key
    );
    if (existing) {
      const updated: Doc = { ...existing, title: normalised || existing.title, content, updatedAt: now };
      setDocs((prev) => prev.map((d) => (d.id === existing.id ? updated : d)));
      return { doc: updated, created: false };
    }
    return { doc: addDoc({ title: normalised, category, content }), created: true };
  };

  // Patch an existing doc and bump its updatedAt.
  const updateDoc = (updated: Doc) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : d))
    );
  };

  const deleteDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const getDoc = (id: string) => docs.find((d) => d.id === id);

  const clearDocs = () => setDocs([]);

  return (
    <DocsContext.Provider value={{ docs, addDoc, upsertDocByTitle, updateDoc, deleteDoc, getDoc, clearDocs }}>
      {children}
    </DocsContext.Provider>
  );
}

export function useDocs() {
  return useContext(DocsContext);
}
