import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme";
import { styles } from "./styles";

/**
 * The Save to Docs dialog. Opens with the suggested title pre-filled
 * so the user can tweak it before saving. The actual write happens
 * in useSaveFlow.confirmSave; this file is just the visual side.
 */

interface Props {
  visible: boolean;                          // Whether the modal is shown.
  accentColor: string;                       // Theme tint for the confirm button.
  saveTitle: string;                         // Current value in the title input.
  onChangeTitle: (next: string) => void;     // Updates the title value.
  onCancel: () => void;                      // Closes the modal without saving.
  onConfirm: () => void;                     // Commits the save.
}

export function SaveModal({ visible, accentColor, saveTitle, onChangeTitle, onCancel, onConfirm }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.saveOverlay}>
        <View style={styles.saveCard}>
          <Text style={styles.saveTitleHeading}>Save to Docs</Text>
          <Text style={styles.saveSubtle}>Give this a title so you can find it later.</Text>

          {/* Multiline so a long suggested title doesn't get truncated. */}
          <TextInput
            value={saveTitle}
            onChangeText={onChangeTitle}
            placeholder="Title"
            placeholderTextColor={colors.textCaption}
            style={styles.saveInput}
            autoFocus
            multiline
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={onConfirm}
          />

          <View style={styles.saveBtnRow}>
            <TouchableOpacity onPress={onCancel} style={styles.saveCancelBtn}>
              <Text style={styles.saveCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.saveConfirmBtn, { backgroundColor: accentColor }]}>
              <Text style={styles.saveConfirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
