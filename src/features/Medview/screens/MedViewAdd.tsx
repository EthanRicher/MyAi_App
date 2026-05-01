import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { usePulseLoop } from "../../../hooks/usePulseLoop";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera } from "lucide-react-native";
import { BackButton } from "../../../components/BackButton";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors } from "../../../theme";
import { useMedications } from "../hooks/useMedication";
import { formatScheduleTime } from "../utils/formatTime";
import { openCameraAndScan, PhotoMode } from "../../../backend/1_Input/Camera/Input_Camera";
import { runAIOnPhoto } from "../../../backend/1_Input/Camera/Input_PhotoToAI";
import { medviewMedicationScan } from "../../../backend/3_Scopes/MedView/Scan_Medication";
import { debugLog, debugPayload } from "../../../backend/_AI/AI_Debug";

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
  const [pickerDate, setPickerDate] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);

  // Cyan breathing pulse over the Scan Prescription button while a scan
  // is in flight — gives a smooth "thinking..." feel.
  const scanPulse = usePulseLoop(isScanning);
  const [dividerMessage, setDividerMessage] = useState("");

  const visibleCount = Math.max(0, Math.min(10, Number(amount) || 0));
  const times = Array.from({ length: visibleCount }, (_, i) => allTimes[i] || "");

  const formatAmPm = (time: string) => formatScheduleTime(time);

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
      const cameraResult = await openCameraAndScan(PhotoMode.VisionWithFallback);

      if (!cameraResult) {
        setIsScanning(false);
        return;
      }

      const uri = cameraResult.imageUri;
      debugLog("MedViewAdd", "Action", "Prescription scan started");
      setImage(uri);

      const aiResult = await runAIOnPhoto(uri, medviewMedicationScan, PhotoMode.VisionWithFallback);

      if (aiResult.error) {
        setError(aiResult.error);
        return;
      }

      debugLog("MedViewAdd", "Result", "Scan parsed");
      debugPayload("MedViewAdd", "scan_result", aiResult);

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

      if (output.name && !output.dose && !output.description) {
        setDividerMessage("No dose or specific instructions provided");
        setTimeout(() => setDividerMessage(""), 3000);
      }

      const hasScannedTimes = Array.isArray(output?.times) && output.times.length > 0;
      const hasScannedTimesPerDay = typeof output?.timesPerDay === "number" && output.timesPerDay > 0;

      if (hasScannedTimes || hasScannedTimesPerDay) {
        const nextTimes = hasScannedTimes
          ? output.times.map((t: string) => normaliseTime(t))
          : allTimes.length > 0 ? allTimes : [];

        const nextTimesPerDay = hasScannedTimesPerDay
          ? output.timesPerDay
          : nextTimes.length;

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
      }
    } finally {
      setIsScanning(false);
    }
  };

  const formatHHMM = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const setTimeAt = (index: number, value: string) => {
    setAllTimes((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    setInvalidFields((prev) => prev.filter((f) => f !== "times"));
  };

  const commitPicker = () => {
    if (showPickerIndex === null) return;
    setTimeAt(showPickerIndex, formatHHMM(pickerDate));
    setShowPickerIndex(null);
  };

  const handleSave = () => {
    const errors: string[] = [];

    if (!name.trim()) errors.push("name");
    if (!dose.trim()) errors.push("dose");
    if (visibleCount <= 0 || times.some((t) => !t.trim())) errors.push("times");

    setInvalidFields(errors);
    if (errors.length > 0) {
      setTimeout(() => setInvalidFields([]), 3000);
    }

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

    debugLog("MedViewAdd", "Action", "Saving medication", { name: payload.name, dose: payload.dose, dosesPerDay: payload.dosesPerDay });

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
      <Modal
        visible={showPickerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={commitPicker}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={commitPicker}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {showPickerIndex !== null ? `Time ${showPickerIndex + 1}` : ""}
            </Text>
            <DateTimePicker
              mode="time"
              value={pickerDate}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  if (event.type === "set" && selectedDate) {
                    setPickerDate(selectedDate);
                    setTimeAt(showPickerIndex!, formatHHMM(selectedDate));
                  }
                  setShowPickerIndex(null);
                } else if (selectedDate) {
                  setPickerDate(selectedDate);
                }
              }}
              style={styles.modalPicker}
            />
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={commitPicker}>
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <BackButton label="MedView" to="MedView" />

      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleScan}
          disabled={isScanning}
          style={[styles.photoBtn, isScanning && styles.photoBtnScanning]}
        >
          {isScanning && (
            <Animated.View
              pointerEvents="none"
              style={[styles.photoBtnPulse, { opacity: scanPulse }]}
            />
          )}
          <Camera size={20} color={colors.text} />
          <Text style={styles.photoBtnText}>
            {isScanning ? "Scanning..." : "Scan Prescription"}
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, dividerMessage ? { color: colors.orange } : undefined]}>
            {dividerMessage || "Or enter manually"}
          </Text>
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

            <View style={styles.timesInner}>
              {times.length === 0 && (
                <View style={styles.noTimesBox}>
                  <Text style={styles.noTimesText}>No Times</Text>
                </View>
              )}
              {times.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    const existing = t ? new Date(`2000-01-01T${t}:00`) : new Date();
                    setPickerDate(existing);
                    setShowPickerIndex(i);
                  }}
                  style={[styles.input, styles.timeItem, invalidFields.includes("times") && styles.errorInput]}
                >
                  <Text style={{ color: t ? colors.text : colors.textMuted }}>
                    {t ? formatAmPm(t) : `Select time ${i + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    overflow: "hidden",
  },

  photoBtnScanning: {
    backgroundColor: colors.border,
  },

  // Cyan glow overlay shown only while scanning. Sits behind the icon and
  // text via absolute fill; opacity is driven by `scanPulse` for a smooth
  // breath-in/out effect.
  photoBtnPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },

  photoBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },

  errorText: {
    color: colors.destructive,
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
    height: 100,
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
    marginTop: 16,
  },

  timesInner: {
    gap: 10,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    gap: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  modalPicker: {
    width: "100%",
  },
  modalConfirmBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
  },
  modalConfirmText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  noTimesBox: {
    height: 80,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  noTimesText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },

  timeItem: {
    marginBottom: 0,
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
    borderColor: colors.destructive,
    borderWidth: 2,
  },

});