import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";
import { openCameraAndScan } from "../../../ai/camera/cameraService";
import { runAI } from "../../../ai/core/runAI";
import { medviewMedicationScan } from "../../../ai/scopes/medviewMedicationScan";
import { addDebugEntry } from "../../../ai/core/debug";
import { AIDebugPanel } from "../../../components/AIDebugPanel";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedViewAdd">;
type Route = RouteProp<RootStackParamList, "MedViewAdd">;

export function MedViewAdd() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

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
  const [isScanning, setIsScanning] = useState(false);

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
    setIsScanning(true);

    try {
      const cameraResult = await openCameraAndScan();

      if (!cameraResult) {
        setIsScanning(false);
        return;
      }

      const uri = cameraResult.imageUri;
      const text = cameraResult.text;

      addDebugEntry("MedViewAdd", "scan_uri", uri);
      setImage(uri);

      if (!text) {
        setError("OCR failed or no text detected");
        return;
      }

      const aiResult = await runAI({ text, scope: medviewMedicationScan });

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
        while (updated.length < targetLength) updated.push("");
        nextTimes.forEach((time: string, index: number) => {
          updated[index] = normaliseTime(time);
        });
        return updated;
      });
    } finally {
      setIsScanning(false);
    }
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

      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleScan}
          disabled={isScanning}
          style={[styles.photoBtn, isScanning && styles.photoBtnScanning]}
        >
          <Camera size={20} color={colors.text} />
          <Text style={styles.photoBtnText}>
            {isScanning ? "Scanning..." : "Scan Image"}
          </Text>
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

            <ScrollView
              nestedScrollEnabled
              style={styles.timesScroll}
              showsVerticalScrollIndicator={times.length > 3}
            >
              {times.map((t, i) => (
                <View key={i} style={styles.timeItem}>
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
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={[styles.saveWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>
            {initialMed ? "Update Medication" : "Save Medication"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },

  photoBtn: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  photoBtnScanning: {
    backgroundColor: colors.border,
  },

  photoBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },

  errorText: {
    color: "red",
    textAlign: "center",
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
    flex: 1,
    gap: 10,
  },

  label: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 2,
  },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 16,
    justifyContent: "center",
  },

  textArea: {
    height: 70,
    textAlignVertical: "top",
    paddingTop: 9,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  rowItem: {
    flex: 1,
  },

  timesWrap: {
    flex: 1,
    gap: 8,
  },

  timesScroll: {
    flex: 1,
  },

  timeItem: {
    marginBottom: 10,
  },

  saveWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  saveBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
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