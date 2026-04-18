import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { addDebugEntry } from "../core/debug";
import { runOCR } from "./ocrService";
import { runVision } from "./runVision";
import { CameraInputResult } from "../../components/ChatScreen";

export enum PhotoMode {
  Vision = "vision",
  OCR = "ocr",
  VisionWithFallback = "vision_with_fallback",
}

export async function openCameraAndScan(mode: PhotoMode = PhotoMode.VisionWithFallback): Promise<CameraInputResult | null> {
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

    if (mode === PhotoMode.OCR) {
      const ocrText = await runOCR(imageUri);
      addDebugEntry("cameraService", "ocr_text", ocrText);
      return {
        imageUri,
        text: ocrText?.trim()
          ? ocrText.trim()
          : "The photo was hard to read. Ask the user to retake it more clearly.",
      };
    }

    if (mode === PhotoMode.Vision) {
      const visionText = await runVision(imageUri);
      addDebugEntry("cameraService", "vision_text", visionText);
      return {
        imageUri,
        text: visionText || "The photo could not be analysed. Please try again.",
      };
    }

    const visionText = await runVision(imageUri);
    if (visionText) {
      addDebugEntry("cameraService", "vision_text", visionText);
      return { imageUri, text: visionText };
    }

    addDebugEntry("cameraService", "vision_empty_falling_back_to_ocr", true);
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
