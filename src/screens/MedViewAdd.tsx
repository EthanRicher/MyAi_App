import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { BackButton } from "../components/BackButton";
import { BackendRequiredModal } from "../components/BackendRequiredModal";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedViewAdd">;

export function MedViewAdd() {
  const navigation = useNavigation<Nav>();
  const [showBackend, setShowBackend] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("Morning");

  return (
    <View style={styles.container}>
      <BackButton label="MedView" to="MedView" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cameraBox}>
          <Camera size={48} color={colors.green} />
          <Text style={styles.cameraText}>Take a photo of your medication</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowBackend(true)}
          style={styles.photoBtn}
          accessibilityLabel="Take photo"
        >
          <Text style={styles.photoBtnText}>Take Photo</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Medication Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Metformin"
              placeholderTextColor={colors.textCaption}
              style={styles.input}
              accessibilityLabel="Medication name"
            />
          </View>
          <View>
            <Text style={styles.label}>Dose</Text>
            <TextInput
              value={dose}
              onChangeText={setDose}
              placeholder="e.g. 500mg"
              placeholderTextColor={colors.textCaption}
              style={styles.input}
              accessibilityLabel="Dose"
            />
          </View>
          <View>
            <Text style={styles.label}>Time of Day</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={time}
                onValueChange={(val) => setTime(val)}
                style={styles.picker}
                dropdownIconColor={colors.textMuted}
              >
                <Picker.Item label="Morning" value="Morning" color={colors.text} />
                <Picker.Item label="Afternoon" value="Afternoon" color={colors.text} />
                <Picker.Item label="Evening" value="Evening" color={colors.text} />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => { Alert.alert("Medication saved"); navigation.navigate("MedView"); }}
            style={styles.saveBtn}
            accessibilityLabel="Save medication"
          >
            <Text style={styles.saveBtnText}>Save Medication</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BackendRequiredModal
        open={showBackend}
        onClose={() => setShowBackend(false)}
        description="Taking a photo requires camera access, OCR processing, and GPT to recognise medication details from the image."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 20 },
  cameraBox: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.green,
    borderRadius: 16,
    backgroundColor: "rgba(76,175,80,0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  cameraText: { color: colors.textMuted, fontSize: 18 },
  photoBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
  },
  photoBtnText: { color: colors.text, fontSize: 18, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textCaption, fontSize: 16 },
  form: { gap: 16 },
  label: { color: colors.textMuted, fontSize: 19, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 18,
  },
  pickerWrap: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: { color: colors.text, height: 50 },
  saveBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: colors.text, fontSize: 20, fontWeight: "700" },
});
