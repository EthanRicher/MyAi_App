import { useState } from "react";
import { Audio } from "expo-av";
import { debugLog, debugTurn } from "../../_AI/AI_Debug";
import type { WhisperResult } from "./Input_Whisper";

/**
 * Reusable speech-input hook. Wraps the platform mic permissions,
 * recording, and transcription handoff. The chat plugs in its own
 * transcribe function (Whisper by default) and onTranscript handler,
 * and gets back a tiny start / stop API plus a recording flag for
 * the UI.
 *
 * onTranscript receives the language detected by the transcriber as
 * a second argument so callers can flag a voice bubble as
 * "Translated to English" when the speaker wasn't using English.
 * Screens that don't care can ignore it.
 */

type UseSpeechInputArgs = {
  transcribe: (uri: string) => Promise<WhisperResult>;                       // How to turn audio into text + detected source language.
  // What to do with the resulting text. `sourceText` is provided when
  // the source language wasn't English so the caller can render both
  // an original-language bubble and an English-translation bubble.
  onTranscript: (
    text: string,
    language?: string,
    sourceText?: string,
  ) => void | Promise<void>;
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

  // Ask for mic permission, configure the audio session, then start a high-quality recording.
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

  /**
   * Stop the recording, fish out the file URI, hand it to the
   * caller's transcribe function, then forward the resulting text
   * to onTranscript. Surfaces friendly errors for missing audio or
   * transcription failures.
   */
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

      const result = await transcribe(uri);
      const text = result?.text || "";

      if (!text || text.startsWith("Error")) {
        setSpeechError(text || "Could not transcribe audio");
        debugLog("Input_SpeechHook", "Error", "Transcription failed", { message: text || "Could not transcribe audio" });
        return;
      }

      await onTranscript(text, result.language, result.sourceText);
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
