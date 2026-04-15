import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { addDebugEntry } from "../core/debug";
import { runOCR } from "./ocrService";
import { CameraInputResult } from "../../components/ChatScreen";

export async function openCameraAndScan(): Promise<CameraInputResult | null> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Please go to Settings and allow camera access for this app.",
        [{ text: "OK" }]
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const rawUri = result.assets[0].uri;
    addDebugEntry("cameraService", "raw_uri", rawUri);

    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    const imageUri = manipulated.uri;
    addDebugEntry("cameraService", "compressed_uri", imageUri);

    const ocrText = await runOCR(imageUri);
    addDebugEntry("cameraService", "ocr_text", ocrText);

    return {
      imageUri,
      text: ocrText?.trim()
        ? ocrText.trim()
        : "The photo was hard to read. Ask the user to retake it more clearly.",
    };
  } catch (err: any) {
    addDebugEntry("cameraService", "error", err?.message || "Camera failed");
    Alert.alert("Camera Error", err?.message || "Could not open camera. Please check your permissions in Settings.");
    return null;
  }
}
