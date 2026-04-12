import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  AI_DEBUG,
  AIDebugEntry,
  clearDebugEntries,
  subscribeDebugEntries,
} from "../ai/core/debug";
import { colors } from "../theme";

type Props = {
  title?: string;
};

const formatPayload = (payload: any) => {
  if (typeof payload === "string") {
    return payload;
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

export function AIDebugPanel({ title = "AI Debug" }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AIDebugEntry[]>([]);

  useEffect(() => {
    return subscribeDebugEntries(setEntries);
  }, []);

  if (!AI_DEBUG) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setOpen((v) => !v)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {open ? "Hide" : "Show"} {title} ({entries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={clearDebugEntries} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.scrollWrap}>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {entries.map((entry) => (
              <View key={entry.id} style={styles.card}>
                <Text style={styles.meta}>
                  {entry.time} · {entry.source}
                </Text>
                <Text style={styles.label}>{entry.label}</Text>
                <Text style={styles.payload}>{formatPayload(entry.payload)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  toggle: {
    flex: 1,
  },

  toggleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
  },

  clearText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  scrollWrap: {
    height: 260,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  body: {
    flex: 1,
  },

  bodyContent: {
    padding: 10,
    gap: 10,
  },

  card: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },

  meta: {
    color: colors.textCaption,
    fontSize: 12,
  },

  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  payload: {
    color: colors.textMuted,
    fontSize: 12,
  },
});