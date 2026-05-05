import { StyleSheet } from "react-native";
import { colors, warningColors, chatBubble } from "../../theme";

/**
 * All the styles for the chat screen in one spot. Bubbles, the
 * bottom buttons, the save modal, banners, the lot. Keeping them
 * together means each subcomponent stays focused on layout and we
 * only have one file to tweak when the look changes.
 */

export const styles = StyleSheet.create({
  // Page scaffolding.
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  messages: { padding: 16, gap: 16 },

  // Bubble alignment. AI on the left, user on the right.
  aiBubbleWrap: { alignItems: "flex-start" },
  userBubbleWrap: { alignItems: "flex-end" },

  // Inline "tap to save" card. Tinted with the chat's accent colour.
  saveOfferCard: {
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    marginVertical: 4,
  },
  saveOfferText: { color: colors.text, fontSize: 16, lineHeight: 22 },
  saveOfferBtn: {
    alignSelf: "stretch",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveOfferBtnText: { fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },

  // The two main bubble shells.
  aiBubble: {
    backgroundColor: chatBubble.ai,
    padding: 16,
    borderRadius: 16,
    width: "95%",
    gap: 10,
  },
  userBubble: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    width: "95%",
    gap: 10,
  },

  userBubbleText: { color: colors.text, fontSize: 16 },

  // Wraps each word so the keyword scanner can drop red flag pills inline.
  userBubbleTextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 4,
    rowGap: 4,
  },
  flagPill: {
    backgroundColor: colors.destructive,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  flagPillText: { color: colors.text, fontSize: 16, fontWeight: "700" },

  // Soft orange treatment for AI-only flags.
  userBubbleAiFlagged: { borderLeftWidth: 4, borderLeftColor: colors.orange },
  aiFlagPill: {
    backgroundColor: colors.orange,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  aiFlagPillText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  errorBubbleText: { color: colors.destructive, fontSize: 16, fontWeight: "700" },

  // Label row. Name on the left, timestamp on the right.
  aiLabel: { fontWeight: "700", marginBottom: 4 },
  userLabel: { fontWeight: "700", color: colors.textMuted },
  bubbleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  // Little hint chip telling the user they can tap the bubble for fullscreen.
  fullscreenHintWrap: { alignItems: "center", marginTop: 4 },
  fullscreenHint: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  fullscreenHintText: { fontSize: 13, fontWeight: "700" },

  // Save to Docs modal.
  saveOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  saveCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 22,
    gap: 12,
  },
  saveTitleHeading: { color: colors.text, fontSize: 20, fontWeight: "700" },
  saveSubtle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  saveInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    maxHeight: 140,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  saveBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  saveCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  saveCancelText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
  saveConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  saveConfirmText: { color: colors.background, fontSize: 16, fontWeight: "700" },

  timestamp: { color: colors.textCaption },
  messageText: { color: colors.text },

  // Markdown title chips inside an AI reply.
  mainTitleChip: {
    alignSelf: "stretch",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  mainTitleText: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  subTitleChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  subTitleText: { fontSize: 14, fontWeight: "700" },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletText: { flex: 1 },

  messageImage: { width: 180, height: 180, borderRadius: 14 },
  // Photo-only bubble. Lets it shrink to the image rather than stretch.
  photoBubble: { width: undefined, alignSelf: "flex-end" },

  // Top disclaimer banner under the back button.
  disclaimerBanner: {
    width: "100%",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disclaimerBannerTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  clearChatBtn: {
    height: 36,
    width: 110,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  clearChatBtnText: { fontSize: 15, fontWeight: "700" },

  // Warning strip pinned to the bottom of an AI bubble when needed.
  messageWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: warningColors.deepBg,
    borderTopWidth: 1,
    borderTopColor: warningColors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    marginHorizontal: -16,
    marginBottom: -16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 8,
  },
  messageWarningIcon: { fontSize: 13, lineHeight: 18 },
  messageWarningText: {
    flex: 1,
    fontSize: 12,
    color: warningColors.text,
    lineHeight: 18,
    fontWeight: "500",
  },

  // Fixed-height label so the layout doesn't jump while recording.
  recordingLabelWrap: { height: 52, alignItems: "center", justifyContent: "center" },
  recordingLabel: { fontSize: 20, fontWeight: "600", textAlign: "center" },

  // Bottom dock. Record / type / photo, plus the swap-in text input row.
  bottomWrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionsCol: { flexDirection: "column", gap: 8 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  singleBtn: {
    width: "100%",
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  recordPulseOverlay: { ...StyleSheet.absoluteFillObject },
  actionText: { fontSize: 24, fontWeight: "700" },

  // Text input row. Replaces the buttons while typing.
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
  },
  sendBtn: { padding: 10, borderRadius: 20 },

  // Empty-state starter chips.
  starterPromptsWrap: { gap: 10, paddingVertical: 8 },
  starterChip: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  starterChipText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
});
