import { Animated, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Camera, Keyboard, Mic, Send, X } from "lucide-react-native";
import { colors, chatActionColors } from "../../theme";
import { styles } from "./styles";

/**
 * The dock at the bottom of the chat. Record / type / photo when
 * idle, a "Currently Recording..." label while the mic is hot, and
 * a swap-in text input row when the user chooses to type. All
 * state lives in the parent; this file is just the visual side.
 */

interface Props {
  accentColor: string;                                                                  // Theme tint for the send button.

  isRecording: boolean;                                                                  // True while the mic is hot.
  recordPulse: Animated.AnimatedInterpolation<number> | Animated.Value;                  // Drives the breathing pulse.
  onMicPress: () => void;                                                                // Toggles recording on / off.

  showTextInput: boolean;                                                                // True when the typing row is visible.
  onOpenText: () => void;                                                                // Opens the typing row.
  onCloseText: () => void;                                                               // Closes the typing row.

  input: string;                                                                         // Current text in the input.
  onChangeInput: (next: string) => void;                                                 // Updates the input value.
  onSendText: () => void;                                                                // Sends the current input.
  placeholder: string;                                                                   // Placeholder text in the input.

  onPhotoPress?: () => void;                                                             // Opens the camera, if any.
  hasCamera: boolean;                                                                    // Whether to show the photo button.
}

export function BottomControls({
  accentColor,
  isRecording,
  recordPulse,
  onMicPress,
  showTextInput,
  onOpenText,
  onCloseText,
  input,
  onChangeInput,
  onSendText,
  placeholder,
  onPhotoPress,
  hasCamera,
}: Props) {
  // Text-input mode. Close button, the input, and send.
  if (showTextInput) {
    return (
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={onCloseText} style={styles.modeBtn}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={onChangeInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onSubmitEditing={onSendText}
          returnKeyType="send"
        />

        <TouchableOpacity
          onPress={onSendText}
          style={[styles.sendBtn, { backgroundColor: accentColor }]}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Idle mode. Full-width record button on top, type / photo pair below.
  return (
    <View style={styles.actionsCol}>
      <TouchableOpacity
        onPress={onMicPress}
        style={[
          styles.singleBtn,
          {
            borderColor: isRecording ? chatActionColors.recordActive : chatActionColors.record,
            backgroundColor: (isRecording ? chatActionColors.recordActive : chatActionColors.record) + "18",
          },
        ]}
      >
        {/* Soft red breathing pulse layered behind the icon while recording. */}
        {isRecording && (
          <Animated.View
            pointerEvents="none"
            style={[styles.recordPulseOverlay, { opacity: recordPulse, backgroundColor: chatActionColors.record }]}
          />
        )}
        <Mic size={22} color={isRecording ? chatActionColors.recordActive : chatActionColors.record} />
        <Text style={[styles.actionText, { color: isRecording ? chatActionColors.recordActive : chatActionColors.record }]}>
          {isRecording ? "Stop" : "Record"}
        </Text>
      </TouchableOpacity>

      {isRecording ? (
        // Swap the type / photo row for a status label so the layout doesn't jump.
        <View style={styles.recordingLabelWrap}>
          <Text style={[styles.recordingLabel, { color: chatActionColors.recordActive }]}>
            Currently Recording...
          </Text>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={onOpenText}
            style={[styles.actionBtn, { borderColor: chatActionColors.type, backgroundColor: chatActionColors.type + "18" }]}
          >
            <Keyboard size={22} color={chatActionColors.type} />
            <Text style={[styles.actionText, { color: chatActionColors.type }]}>Type</Text>
          </TouchableOpacity>

          {hasCamera && !!onPhotoPress && (
            <TouchableOpacity
              onPress={onPhotoPress}
              style={[styles.actionBtn, { borderColor: chatActionColors.photo, backgroundColor: chatActionColors.photo + "18" }]}
            >
              <Camera size={22} color={chatActionColors.photo} />
              <Text style={[styles.actionText, { color: chatActionColors.photo }]}>Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
