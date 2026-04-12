import { useState } from "react";
import { Audio } from "expo-av";
import { addDebugEntry } from "../core/debug";

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

      const permission = await Audio.requestPermissionsAsync();

      addDebugEntry("SpeechHook", "permission", permission);

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

      addDebugEntry("SpeechHook", "recording_state", "started");
    } catch {
      setSpeechError("Could not start recording");
      addDebugEntry("SpeechHook", "error", "Could not start recording");
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

      addDebugEntry("SpeechHook", "recording_state", "stopped");
      addDebugEntry("SpeechHook", "recorded_uri", uri || "");

      if (!uri) {
        setSpeechError("No audio file found");
        return;
      }

      const text = await transcribe(uri);

      if (!text || text.startsWith("Error")) {
        setSpeechError(text || "Could not transcribe audio");
        addDebugEntry("SpeechHook", "error", text || "Could not transcribe audio");
        return;
      }

      addDebugEntry("SpeechHook", "transcript", text);
      await onTranscript(text);
    } catch {
      setSpeechError("Could not stop recording");
      setRecording(null);
      setIsRecording(false);
      addDebugEntry("SpeechHook", "error", "Could not stop recording");
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