import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { ChevronDown, ChevronUp, User, Lock, Shield, Eye, Bell, Clock, Phone, HelpCircle, Trash2 } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { BackButton } from "../components/BackButton";
import { colors } from "../theme";

function ToggleSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.toggle, { backgroundColor: on ? colors.green : colors.border }]}
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
    >
      <View style={[styles.toggleThumb, { left: on ? 24 : 4 }]} />
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Accessibility: true, "Emergency Access": true });
  const [fontSize, setFontSize] = useState(18);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [familyAccess, setFamilyAccess] = useState(true);
  const [familyEmail, setFamilyEmail] = useState("daughter@email.com");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggle = (title: string) => setExpanded((p) => ({ ...p, [title]: !p[title] }));

  const sections = [
    {
      title: "About Me", icon: User,
      content: (
        <View style={styles.sectionContent}>
          <View><Text style={styles.fieldLabel}>Name</Text><Text style={styles.fieldValue}>Margaret Thompson</Text></View>
          <View><Text style={styles.fieldLabel}>Preferences</Text><Text style={styles.fieldValueMuted}>Large text, simple language</Text></View>
          <View><Text style={styles.fieldLabel}>Interests</Text><Text style={styles.fieldValueMuted}>Gardening, cooking, family</Text></View>
          <View><Text style={styles.fieldLabel}>Language</Text><Text style={styles.fieldValueMuted}>English (Australia)</Text></View>
        </View>
      ),
    },
    {
      title: "Login & Security", icon: Lock,
      content: (
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.secBtn}><Text style={styles.secBtnText}>Change Passcode</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secBtn}><Text style={styles.secBtnText}>Change PIN</Text></TouchableOpacity>
          <Text style={styles.noteText}>Trusted devices: iPhone (this device)</Text>
        </View>
      ),
    },
    {
      title: "Privacy", icon: Shield,
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.privacyNote}>All data is stored locally on your device.</Text>
          <Text style={styles.privacyNote}>No data has been shared.</Text>
          <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} style={styles.deleteDataBtn}>
            <Trash2 size={16} color={colors.text} />
            <Text style={styles.deleteDataText}>Delete All My Data</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: "Accessibility", icon: Eye,
      content: (
        <View style={styles.sectionContent}>
          <View>
            <View style={styles.row}>
              <Text style={styles.settingLabel}>Font Size</Text>
              <Text style={styles.settingValue}>{fontSize}px</Text>
            </View>
            <Slider
              minimumValue={14}
              maximumValue={28}
              value={fontSize}
              onValueChange={(v) => setFontSize(Math.round(v))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.row}>
              <Text style={styles.sliderMin}>14px</Text>
              <Text style={styles.sliderMax}>28px</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.settingLabel}>High Contrast</Text>
            <ToggleSwitch on={highContrast} onToggle={() => setHighContrast(!highContrast)} label="High contrast toggle" />
          </View>
          <View style={styles.row}>
            <Text style={styles.settingLabel}>Reduced Motion</Text>
            <ToggleSwitch on={reducedMotion} onToggle={() => setReducedMotion(!reducedMotion)} label="Reduced motion toggle" />
          </View>
        </View>
      ),
    },
    {
      title: "Notifications", icon: Bell,
      content: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Text style={styles.settingLabel}>Break Reminders</Text>
            <ToggleSwitch on={true} onToggle={() => {}} label="Break reminders toggle" />
          </View>
          <View style={styles.row}>
            <Text style={styles.settingLabel}>Daily Prompts</Text>
            <ToggleSwitch on={true} onToggle={() => {}} label="Daily prompts toggle" />
          </View>
        </View>
      ),
    },
    {
      title: "Healthy Usage", icon: Clock,
      content: (
        <View style={styles.sectionContent}>
          <Text style={styles.privacyNote}>Session time today: 25 minutes</Text>
          <Text style={styles.privacyNote}>Break reminder: every 30 minutes</Text>
        </View>
      ),
    },
    {
      title: "Emergency Access", icon: Phone,
      content: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Text style={styles.settingLabel}>Family Access</Text>
            <ToggleSwitch on={familyAccess} onToggle={() => setFamilyAccess(!familyAccess)} label="Family access toggle" />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Family email</Text>
            <TextInput
              value={familyEmail}
              onChangeText={setFamilyEmail}
              style={styles.emailInput}
              placeholderTextColor={colors.textCaption}
              accessibilityLabel="Family member email"
            />
          </View>
          <Text style={styles.warningText}>Access is always logged and visible to you.</Text>
          <View style={styles.accessLog}>
            <Text style={styles.accessLogText}>Last access: 15 Mar 2026 by daughter@email.com</Text>
          </View>
        </View>
      ),
    },
    {
      title: "Help & Support", icon: HelpCircle,
      content: (
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.secBtn}><Text style={styles.secBtnText}>Frequently Asked Questions</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secBtn}><Text style={styles.secBtnText}>Contact Support</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secBtn}><Text style={styles.secBtnText}>How to Use MyAI</Text></TouchableOpacity>
        </View>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <BackButton label="Dashboard" to="Main" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>
        <View style={styles.sectionList}>
          {sections.map((s) => (
            <View key={s.title} style={styles.section}>
              <TouchableOpacity onPress={() => toggle(s.title)} style={styles.sectionHeader} accessibilityState={{ expanded: !!expanded[s.title] }}>
                <View style={styles.sectionHeaderLeft}>
                  <s.icon size={24} color={colors.textMuted} />
                  <Text style={styles.sectionTitle}>{s.title}</Text>
                </View>
                {expanded[s.title] ? <ChevronUp size={22} color={colors.textCaption} /> : <ChevronDown size={22} color={colors.textCaption} />}
              </TouchableOpacity>
              {expanded[s.title] && <View style={styles.sectionBody}>{s.content}</View>}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Trash2 size={36} color={colors.destructive} style={styles.confirmIcon} />
            <Text style={styles.confirmTitle}>Delete All Data?</Text>
            <Text style={styles.confirmDesc}>This will permanently remove all your data from this device. This action cannot be undone.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Delete</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  heading: { color: colors.text, fontSize: 26, fontWeight: "700", marginBottom: 20 },
  sectionList: { gap: 12 },
  section: { backgroundColor: colors.card, borderRadius: 12, overflow: "hidden" },
  sectionHeader: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "600" },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionContent: { gap: 12 },
  fieldLabel: { color: colors.textCaption, fontSize: 13, marginBottom: 2 },
  fieldValue: { color: colors.text },
  fieldValueMuted: { color: colors.textMuted },
  secBtn: { width: "100%", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  secBtnText: { color: colors.textMuted, fontSize: 15 },
  noteText: { color: colors.textCaption, fontSize: 13 },
  privacyNote: { color: colors.textMuted, fontSize: 14 },
  deleteDataBtn: { width: "100%", paddingVertical: 10, borderRadius: 12, backgroundColor: colors.destructive, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  deleteDataText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  settingLabel: { color: colors.textMuted, fontSize: 15 },
  settingValue: { color: colors.text, fontSize: 15, fontWeight: "600" },
  sliderMin: { color: colors.textCaption, fontSize: 12 },
  sliderMax: { color: colors.textCaption, fontSize: 12 },
  toggle: { width: 48, height: 28, borderRadius: 14, position: "relative" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.text, position: "absolute", top: 4 },
  warningText: { color: colors.orange, fontSize: 13 },
  emailInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 15 },
  accessLog: { backgroundColor: colors.background, borderRadius: 12, padding: 12 },
  accessLogText: { color: colors.textCaption, fontSize: 13 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  confirmCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, marginHorizontal: 24, maxWidth: 320, width: "100%", alignItems: "center" },
  confirmIcon: { marginBottom: 12 },
  confirmTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  confirmDesc: { color: colors.textMuted, fontSize: 15, lineHeight: 23, marginBottom: 20, textAlign: "center" },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
  deleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.destructive, alignItems: "center" },
  deleteBtnText: { color: colors.text, fontSize: 16, fontWeight: "600" },
});
