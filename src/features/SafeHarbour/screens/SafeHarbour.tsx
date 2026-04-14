import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { AlertTriangle, ChevronDown, ChevronUp, Phone, Shield, Link, DollarSign, Eye } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { colors } from "../../../theme";

const educationCards = [
  { title: "Scam Warning Signs", icon: AlertTriangle, content: "Watch for: urgent language, requests for personal info, threats, unexpected prizes, and pressure to keep secrets." },
  { title: "Before Clicking Links", icon: Link, content: "Check: Does the email look real? Is the URL correct? Were you expecting it? When in doubt, type the address directly." },
  { title: "If I Suspect Fraud", icon: Eye, content: "Don't send money or details. Contact your bank. Call Scamwatch 1300 795 995. Tell someone you trust. Keep evidence." },
  { title: "Financial Safety", icon: DollarSign, content: "Never share PINs or passwords. Don't transfer money to strangers. Banks never ask for passwords by phone or email." },
];

const safeHabits = [
  { n: 1, title: "Pause First", desc: "If urgent, take a breath. Scammers want quick action." },
  { n: 2, title: "Verify Yourself", desc: "Call the organisation using a number you trust." },
  { n: 3, title: "Protect Info", desc: "Never share passwords or financial details online." },
  { n: 4, title: "Talk to Someone", desc: "Discuss money decisions with someone you trust." },
  { n: 5, title: "Report It", desc: "Report scams to Scamwatch (1300 795 995)." },
];

export function SafeHarbour() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [messageText, setMessageText] = useState("");
  const [showResult, setShowResult] = useState(false);

  const toggleCard = (i: number) => setExpanded((p) => ({ ...p, [i]: !p[i] }));

  return (
    <View style={styles.container}>
      <BackButton label="Home" to="Home" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>SafeHarbour</Text>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Check This Message</Text>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Paste a suspicious message here..."
            placeholderTextColor={colors.textCaption}
            style={styles.textarea}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Suspicious message text"
          />
          <TouchableOpacity onPress={() => setShowResult(true)} style={styles.checkBtn} accessibilityLabel="Check this message">
            <Text style={styles.checkBtnText}>Check This Message</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.accordionList}>
          {educationCards.map((c, i) => (
            <View key={c.title} style={styles.accordion}>
              <TouchableOpacity
                onPress={() => toggleCard(i)}
                style={styles.accordionHeader}
                accessibilityLabel={c.title}
                accessibilityState={{ expanded: !!expanded[i] }}
              >
                <View style={styles.accordionTitle}>
                  <c.icon size={24} color={colors.orange} />
                  <Text style={styles.accordionTitleText}>{c.title}</Text>
                </View>
                {expanded[i] ? <ChevronUp size={22} color={colors.textCaption} /> : <ChevronDown size={22} color={colors.textCaption} />}
              </TouchableOpacity>
              {expanded[i] && (
                <View style={styles.accordionBody}>
                  <Text style={styles.accordionBodyText}>{c.content}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>5 Safe AI Habits</Text>
          <View style={styles.habitsList}>
            {safeHabits.map((h) => (
              <View key={h.n} style={styles.habitRow}>
                <View style={styles.habitNum}>
                  <Text style={styles.habitNumText}>{h.n}</Text>
                </View>
                <View style={styles.habitText}>
                  <Text style={styles.habitTitle}>{h.title}</Text>
                  <Text style={styles.habitDesc}>{h.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Emergency Contacts</Text>
          <View style={styles.contactList}>
            <View style={styles.contactRow}>
              <Phone size={20} color={colors.red} />
              <Text style={styles.contactText}>Scamwatch: <Text style={styles.contactBold}>1300 795 995</Text></Text>
            </View>
            <View style={styles.contactRow}>
              <Shield size={20} color={colors.red} />
              <Text style={styles.contactText}>IDCARE: <Text style={styles.contactBold}>1800 595 160</Text></Text>
            </View>
          </View>
        </View>

        <Text style={styles.disclaimer}>Education only. If you suspect fraud, contact your bank.</Text>
      </ScrollView>

      <Modal visible={showResult} transparent animationType="fade" onRequestClose={() => setShowResult(false)}>
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <View style={styles.warnCircle}>
              <AlertTriangle size={40} color={colors.red} />
            </View>
            <Text style={styles.warnTitle}>Warning: Likely a Scam</Text>
            <Text style={styles.flagsLabel}>Red flags detected:</Text>
            {["Uses urgency to pressure you", "Requests personal information", "Suspicious or unknown source"].map((f) => (
              <View key={f} style={styles.flagRow}>
                <AlertTriangle size={16} color={colors.orange} />
                <Text style={styles.flagText}>{f}</Text>
              </View>
            ))}
            <View style={styles.resultBtns}>
              <TouchableOpacity style={styles.reportBtn}>
                <Text style={styles.reportBtnText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowResult(false)} style={styles.closeBtnResult}>
                <Text style={styles.closeBtnResultText}>Close</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 20 },
  heading: { color: colors.text, fontSize: 26, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  cardHeading: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 12 },
  textarea: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 18, minHeight: 100, marginBottom: 12 },
  checkBtn: { width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: colors.red, alignItems: "center" },
  checkBtnText: { color: colors.text, fontSize: 20, fontWeight: "700" },
  accordionList: { gap: 12 },
  accordion: { backgroundColor: colors.card, borderRadius: 12, overflow: "hidden", borderLeftWidth: 4, borderLeftColor: colors.red },
  accordionHeader: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  accordionTitle: { flexDirection: "row", alignItems: "center", gap: 12 },
  accordionTitleText: { color: colors.text, fontSize: 19, fontWeight: "600" },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  accordionBodyText: { color: colors.textMuted, fontSize: 17, lineHeight: 27 },
  habitsList: { gap: 16 },
  habitRow: { flexDirection: "row", gap: 12 },
  habitNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.red, alignItems: "center", justifyContent: "center" },
  habitNumText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  habitText: { flex: 1 },
  habitTitle: { color: colors.text, fontSize: 18, fontWeight: "600" },
  habitDesc: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  contactList: { gap: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { color: colors.textMuted, fontSize: 17 },
  contactBold: { color: colors.text, fontWeight: "700" },
  disclaimer: { color: colors.textCaption, textAlign: "center", fontSize: 15, lineHeight: 23 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  resultCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, marginHorizontal: 20, maxWidth: 360, width: "100%", alignItems: "center", gap: 12 },
  warnCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.red, alignItems: "center", justifyContent: "center" },
  warnTitle: { color: colors.red, fontSize: 24, fontWeight: "700", textAlign: "center" },
  flagsLabel: { color: colors.textMuted, fontSize: 17, fontWeight: "600", alignSelf: "flex-start" },
  flagRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, alignSelf: "flex-start" },
  flagText: { color: colors.textMuted, fontSize: 16, flex: 1 },
  resultBtns: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  reportBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.red, alignItems: "center" },
  reportBtnText: { color: colors.text, fontSize: 18, fontWeight: "600" },
  closeBtnResult: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  closeBtnResultText: { color: colors.textMuted, fontSize: 18, fontWeight: "600" },
});
