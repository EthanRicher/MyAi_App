import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { parseMarkdown, parseInline } from "../../../components/markdown";
import { useDocs } from "../hooks/useDocs";
import { CATEGORY_LABELS } from "../models/Doc";

type Nav = NativeStackNavigationProp<RootStackParamList, "DocsDetail">;
type Route = RouteProp<RootStackParamList, "DocsDetail">;

const renderInline = (text: string) =>
  parseInline(text).map((seg, j) =>
    seg.kind === "bold"
      ? <Text key={j} style={{ fontWeight: "800" }}>{seg.text}</Text>
      : seg.text
  );

const renderContent = (text: string) =>
  parseMarkdown(text).map((token, i) => {
    switch (token.kind) {
      case "mainTitle":
        return (
          <View key={i} style={styles.mainTitleChip}>
            <Text style={styles.mainTitleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {token.text}
            </Text>
          </View>
        );
      case "subTitle":
        return (
          <View key={i} style={styles.subTitleChip}>
            <Text style={styles.subTitleText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {token.text}
            </Text>
          </View>
        );
      case "bullet":
        return (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{renderInline(token.text)}</Text>
          </View>
        );
      case "paragraph":
        return <Text key={i} style={styles.paragraph}>{renderInline(token.text)}</Text>;
    }
  });

export function DocsDetail() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { getDoc, deleteDoc } = useDocs();
  const doc = getDoc(route.params.id);
  const [confirming, setConfirming] = useState(false);

  if (!doc) {
    return (
      <View style={styles.container}>
        <BackButton label="Docs" to="Docs" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This document is no longer available.</Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    deleteDoc(doc.id);
    setConfirming(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <BackButton
        label="Docs"
        to="Docs"
        right={
          <TouchableOpacity
            onPress={() => setConfirming(true)}
            style={styles.deleteBtn}
            accessibilityLabel="Delete this document"
          >
            <Trash2 size={20} color={colors.destructive} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{CATEGORY_LABELS[doc.category]}</Text>
          <Text style={styles.title}>{doc.title}</Text>
          <Text style={styles.date}>
            Last updated {new Date(doc.updatedAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.body}>{renderContent(doc.content)}</View>
      </ScrollView>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Trash2 size={32} color={colors.destructive} style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Delete this document?</Text>
            <Text style={styles.confirmDesc}>This cannot be undone.</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity onPress={() => setConfirming(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteConfirmBtn}>
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32, gap: 18 },
  missing: { padding: 32, alignItems: "center" },
  missingText: { color: colors.textMuted, fontSize: 16 },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  header: {
    gap: 6,
  },
  category: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  date: {
    color: colors.textCaption,
    fontSize: 13,
  },
  body: {
    gap: 10,
  },
  mainTitleChip: {
    backgroundColor: colors.primary + "33",
    borderColor: colors.primary + "88",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginVertical: 6,
  },
  mainTitleText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  subTitleChip: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary + "99",
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  subTitleText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletDot: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  paragraph: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 320,
    alignItems: "center",
  },
  confirmTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
  },
  confirmDesc: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 18,
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.destructive,
    alignItems: "center",
  },
  deleteConfirmText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
