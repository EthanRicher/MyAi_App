import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { debugLog, debugTurn } from "../../_AI/AI_Debug";
import { runOCR } from "./Input_OCR";
import { runVision } from "./Input_Vision";
import { CameraInputResult } from "../../../components/ChatScreen";

export enum PhotoMode {
  Vision = "vision",
  OCR = "ocr",
  VisionWithFallback = "vision_with_fallback",
}

// Default camera handler used by chat screens — opens camera in
// VisionWithFallback mode. Pass directly as ChatScreen's onCameraPress.
export const defaultCameraHandler = (onImageReady: (uri: string) => void) =>
  openCameraAndScan(PhotoMode.VisionWithFallback, onImageReady);

export async function openCameraAndScan(
  mode: PhotoMode = PhotoMode.VisionWithFallback,
  onImageReady?: (imageUri: string) => void
): Promise<CameraInputResult | null> {
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
    debugTurn();
    debugLog("Input_Camera", "Action", "Photo taken", { mode });

    const manipulated = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    const imageUri = manipulated.uri;

    // Show image in chat immediately before AI processing starts
    onImageReady?.(imageUri);

    if (mode === PhotoMode.OCR) {
      const ocrText = await runOCR(imageUri);
      return {
        imageUri,
        text: ocrText?.trim()
          ? ocrText.trim()
          : "The photo was hard to read. Ask the user to retake it more clearly.",
      };
    }

    if (mode === PhotoMode.Vision) {
      const visionText = await runVision(imageUri);
      return {
        imageUri,
        text: visionText || "The photo could not be analysed. Please try again.",
      };
    }

    const visionText = await runVision(imageUri);
    if (visionText) {
      return { imageUri, text: visionText };
    }

    debugLog("Input_Camera", "Action", "Vision empty - falling back to OCR");
    const ocrText = await runOCR(imageUri);
    return {
      imageUri,
      text: ocrText?.trim()
        ? ocrText.trim()
        : "The photo was hard to read. Ask the user to retake it more clearly.",
    };
  } catch (err: any) {
    debugLog("Input_Camera", "Error", "Camera failed", { message: err?.message || "Camera failed" });
    Alert.alert("Camera Error", err?.message || "Could not open camera. Please check your permissions in Settings.");
    return null;
  }
}
