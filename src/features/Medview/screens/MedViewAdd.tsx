import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";
import { scanMedicationFromPhoto } from "../services/medviewAI";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedViewAdd">;
type Route = RouteProp<RootStackParamList, "MedViewAdd">;

export function MedViewAdd() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [initialMed] = useState(route.params?.med);

  const { addMed, updateMed } = useMedications();

  const [name, setName] = useState(initialMed?.name || "");
  const [dose, setDose] = useState(initialMed?.dose || "");
  const [description, setDescription] = useState(initialMed?.description || "");

  const [amount, setAmount] = useState(
    initialMed ? initialMed.dosesPerDay.toString() : ""
  );

  const [allTimes, setAllTimes] = useState<string[]>(
    initialMed?.times || []
  );

  const [image, setImage] = useState<string | null>(
    initialMed?.image || null
  );

  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const visibleCount = Number(amount) || 0;
  const times = allTimes.slice(0, visibleCount);

  const [showPickerIndex, setShowPickerIndex] = useState<number | null>(null);

  const handleScan = async () => {
    setError("");

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    setImage(uri);

    const aiResult = await scanMedicationFromPhoto(uri);

    if (aiResult.error) {
      setError(aiResult.error);
      return;
    }

    setName(aiResult.name);
    setDose(aiResult.dose);
    setDescription(aiResult.description);

    setAmount("1");
    setAllTimes(["08:00"]);
  };

  const handleSave = () => {
    const errors: string[] = [];

    if (!name) errors.push("name");
    if (!dose) errors.push("dose");
    if (times.length === 0 || times.some((t) => !t)) errors.push("times");

    setInvalidFields(errors);

    if (errors.length > 0) {
      setError("Please fill all required fields");
      return;
    }

    setError("");

    const finalTimes = allTimes.slice(0, visibleCount);

    if (initialMed) {
      updateMed({
        ...initialMed,
        name,
        dose,
        description,
        dosesPerDay: Number(amount) || 0,
        times: finalTimes,
        image,
      });
    } else {
      addMed({
        name,
        dose,
        description,
        dosesPerDay: Number(amount) || 0,
        times: finalTimes,
        image,
      });
    }

    navigation.navigate("MedView");
  };

  return (
    <View style={styles.container}>
      <BackButton label="MedView" to="MedView" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cameraBox}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: "100%", height: "100%", borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <>
              <Camera size={48} color={colors.green} />
              <Text style={styles.cameraText}>Scan your medication</Text>
            </>
          )}
        </View>

        <TouchableOpacity onPress={handleScan} style={styles.photoBtn}>
          <Text style={styles.photoBtnText}>Scan Image</Text>
        </TouchableOpacity>

        {error ? (
          <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>
        ) : null}

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
              onChangeText={(t) => {
                setName(t);
                setInvalidFields(prev => prev.filter(f => f !== "name"));
              }}
              placeholder="e.g. Metformin"
              placeholderTextColor={colors.textCaption}
              style={[
                styles.input,
                invalidFields.includes("name") && styles.errorInput
              ]}
            />
          </View>

          <View>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What is this for?"
              placeholderTextColor={colors.textCaption}
              style={[styles.input, styles.textArea]}
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Dose</Text>
              <TextInput
                value={dose}
                onChangeText={(t) => {
                  setDose(t);
                  setInvalidFields(prev => prev.filter(f => f !== "dose"));
                }}
                placeholder="500mg"
                placeholderTextColor={colors.textCaption}
                style={[
                  styles.input,
                  invalidFields.includes("dose") && styles.errorInput
                ]}
              />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Times</Text>
              <TextInput
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);

                  const num = Math.max(0, Math.min(10, Number(t) || 0));

                  setAllTimes((prev) => {
                    const updated = [...prev];
                    while (updated.length < num) updated.push("");
                    return updated;
                  });
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textCaption}
                style={[
                  styles.input,
                  invalidFields.includes("times") && styles.errorInput
                ]}
              />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={styles.label}>Select Times</Text>

            {times.map((t, i) => (
              <View key={i}>
                <TouchableOpacity
                  onPress={() => setShowPickerIndex(i)}
                  style={[
                    styles.input,
                    invalidFields.includes("times") && styles.errorInput
                  ]}
                >
                  <Text style={{ color: t ? colors.text : colors.textMuted }}>
                    {t || `Select time ${i + 1}`}
                  </Text>
                </TouchableOpacity>

                {showPickerIndex === i && (
                  <DateTimePicker
                    mode="time"
                    value={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowPickerIndex(null);

                      if (selectedDate) {
                        const updated = [...allTimes];
                        updated[i] = selectedDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        setAllTimes(updated);
                      }
                    }}
                  />
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>
              {initialMed ? "Update Medication" : "Save Medication"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },

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

  label: { color: colors.textMuted, fontSize: 16, marginBottom: 4 },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    justifyContent: "center",
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  rowItem: {
    flex: 1,
  },

  saveBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    marginTop: 8,
  },

  saveBtnText: { color: colors.text, fontSize: 18, fontWeight: "700" },

  errorInput: {
    borderColor: "red",
    borderWidth: 2,
  },
});