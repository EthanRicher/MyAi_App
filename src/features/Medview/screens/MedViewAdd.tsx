import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";
import { runOCR } from "../../../ai/camera/ocrService";
import { runAI } from "../../../ai/core/runAI";
import { medviewMedicationScan } from "../../../ai/scopes/medviewMedicationScan";
import { addDebugEntry } from "../../../ai/core/debug";
import { AIDebugPanel } from "../../../components/AIDebugPanel";

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
    initialMed ? String(initialMed.dosesPerDay) : ""
  );
  const [allTimes, setAllTimes] = useState<string[]>(initialMed?.times || []);
  const [image, setImage] = useState<string | null>(initialMed?.image || null);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [showPickerIndex, setShowPickerIndex] = useState<number | null>(null);

  const visibleCount = Math.max(0, Math.min(10, Number(amount) || 0));
  const times = Array.from({ length: visibleCount }, (_, i) => allTimes[i] || "");

  const normaliseTime = (value: string) => {
    const trimmed = value.trim();

    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(":").map(Number);
      const hour = Math.max(0, Math.min(23, h));
      const minute = Math.max(0, Math.min(59, m));
      return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }

    return trimmed;
  };

  const handleScan = async () => {
    setError("");

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const rawUri = result.assets[0].uri;

    addDebugEntry("MedViewAdd", "raw_image_uri", rawUri);

    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 1000 } }],
      {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const uri = manipulated.uri;

    addDebugEntry("MedViewAdd", "compressed_image", manipulated);

    setImage(uri);

    const text = await runOCR(uri);

    if (!text) {
      setError("OCR failed or no text detected");
      return;
    }

    const aiResult = await runAI({
      text,
      scope: medviewMedicationScan,
    });

    if (aiResult.error) {
      setError(aiResult.error);
      return;
    }

    addDebugEntry("MedViewAdd", "scan_result", aiResult);

    const output = aiResult.output || {};
    const isInvalid =
      output.status === "Invalid" &&
      !output.name &&
      !output.dose &&
      !output.description;

    if (isInvalid) {
      setError(output.explanation || "No medication detected");
      return;
    }

    setName((prev) => output.name || prev);
    setDose((prev) => output.dose || prev);
    setDescription((prev) => output.description || prev);

    const nextTimes =
      Array.isArray(output?.times) && output.times.length > 0
        ? output.times.map((t: string) => normaliseTime(t))
        : allTimes.length > 0
        ? allTimes
        : ["08:00"];

    const nextTimesPerDay =
      typeof output?.timesPerDay === "number" && output.timesPerDay > 0
        ? output.timesPerDay
        : nextTimes.length > 0
        ? nextTimes.length
        : 1;

    setAmount(String(nextTimesPerDay));
    setAllTimes((prev) => {
      const updated = [...prev];
      const targetLength = Math.max(updated.length, nextTimesPerDay);

      while (updated.length < targetLength) {
        updated.push("");
      }

      nextTimes.forEach((time: string, index: number) => {
        updated[index] = normaliseTime(time);
      });

      return updated;
    });
  };

  const handleSave = () => {
    const errors: string[] = [];

    if (!name.trim()) errors.push("name");
    if (!dose.trim()) errors.push("dose");
    if (visibleCount <= 0 || times.some((t) => !t.trim())) errors.push("times");

    setInvalidFields(errors);

    if (errors.length > 0) {
      setError("Please fill all required fields");
      return;
    }

    setError("");

    const finalTimes = Array.from({ length: visibleCount }, (_, i) =>
      normaliseTime(allTimes[i] || "")
    );

    const payload = {
      name: name.trim(),
      dose: dose.trim(),
      description: description.trim(),
      dosesPerDay: visibleCount,
      times: finalTimes,
      image,
    };

    addDebugEntry("MedViewAdd", "save_payload", payload);

    if (initialMed) {
      const nextTaken = finalTimes.map((_, index) => Boolean(initialMed.taken?.[index]));

      updateMed({
        ...initialMed,
        ...payload,
        taken: nextTaken,
      });
    } else {
      addMed(payload);
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
              style={styles.previewImage}
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AIDebugPanel title="Scan Debug" />

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
                setInvalidFields((prev) => prev.filter((f) => f !== "name"));
              }}
              placeholder="e.g. Metformin"
              placeholderTextColor={colors.textCaption}
              style={[
                styles.input,
                invalidFields.includes("name") && styles.errorInput,
              ]}
            />
          </View>

          <View>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Instructions"
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
                  setInvalidFields((prev) => prev.filter((f) => f !== "dose"));
                }}
                placeholder="500mg"
                placeholderTextColor={colors.textCaption}
                style={[
                  styles.input,
                  invalidFields.includes("dose") && styles.errorInput,
                ]}
              />
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.label}>Times</Text>
              <TextInput
                value={amount}
                onChangeText={(t) => {
                  const clean = t.replace(/[^0-9]/g, "").slice(0, 2);
                  const num = Math.max(0, Math.min(10, Number(clean) || 0));

                  setAmount(clean);

                  setAllTimes((prev) => {
                    const updated = [...prev];

                    while (updated.length < num) {
                      updated.push("");
                    }

                    return updated;
                  });

                  setInvalidFields((prev) => prev.filter((f) => f !== "times"));
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textCaption}
                style={[
                  styles.input,
                  invalidFields.includes("times") && styles.errorInput,
                ]}
              />
            </View>
          </View>

          <View style={styles.timesWrap}>
            <Text style={styles.label}>Select Times</Text>

            {times.map((t, i) => (
              <View key={i}>
                <TouchableOpacity
                  onPress={() => setShowPickerIndex(i)}
                  style={[
                    styles.input,
                    invalidFields.includes("times") && styles.errorInput,
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
                        const hours = selectedDate
                          .getHours()
                          .toString()
                          .padStart(2, "0");
                        const minutes = selectedDate
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");

                        setAllTimes((prev) => {
                          const updated = [...prev];
                          updated[i] = `${hours}:${minutes}`;
                          return updated;
                        });

                        setInvalidFields((prev) =>
                          prev.filter((f) => f !== "times")
                        );
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

  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

  cameraText: {
    color: colors.textMuted,
    fontSize: 18,
  },

  photoBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
  },

  photoBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },

  errorText: {
    color: "red",
    marginTop: 8,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  dividerText: {
    color: colors.textCaption,
    fontSize: 16,
  },

  form: {
    gap: 16,
  },

  label: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 4,
  },

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

  timesWrap: {
    gap: 10,
  },

  saveBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    marginTop: 8,
  },

  saveBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },

  errorInput: {
    borderColor: "red",
    borderWidth: 2,
  },
});