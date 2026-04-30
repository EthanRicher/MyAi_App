import { useState } from "react";
import { Audio } from "expo-av";
import { debugLog, debugTurn } from "../../_AI/AI_Debug";

type UseSpeechInputArgs = {
  transcribe: (uri: string) => Promise<string>;
  onTranscript: (text: string) => void | Promise<void>;
};

export function useSpeechInput({
  transcribe,
  onTranscript,
}: UseSpeechInputArgs) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const clearSpeechError = () => {
    setSpeechError("");
  };

  const startRecording = async () => {
    try {
      clearSpeechError();
      debugTurn();

      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== "granted") {
        setSpeechError("Microphone permission denied");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      setRecording(rec);
      setIsRecording(true);

      debugLog("Input_SpeechHook", "Action", "Recording started");
    } catch {
      setSpeechError("Could not start recording");
      debugLog("Input_SpeechHook", "Error", "Could not start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setIsRecording(false);

      debugLog("Input_SpeechHook", "Action", "Recording stopped");

      if (!uri) {
        setSpeechError("No audio file found");
        return;
      }

      const text = await transcribe(uri);

      if (!text || text.startsWith("Error")) {
        setSpeechError(text || "Could not transcribe audio");
        debugLog("Input_SpeechHook", "Error", "Transcription failed", { message: text || "Could not transcribe audio" });
        return;
      }

      await onTranscript(text);
    } catch {
      setSpeechError("Could not stop recording");
      setRecording(null);
      setIsRecording(false);
      debugLog("Input_SpeechHook", "Error", "Could not stop recording");
    }
  };

  return {
    isRecording,
    speechError,
    clearSpeechError,
    startRecording,
    stopRecording,
  };
}