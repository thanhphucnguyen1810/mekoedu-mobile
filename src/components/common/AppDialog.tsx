import React from "react";
import { StyleSheet } from 'react-native';
import { Dialog, Portal } from 'react-native-paper';

import { C, Spacing } from '@/src/theme';

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

interface AppDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  content: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  type?: 'info' | 'error' | 'warning';
}

export const AppDialog = ({
  visible,
  onDismiss,
  title,
  content,
  confirmLabel = 'Xác nhận',
  onConfirm,
  cancelLabel = 'Hủy',
  type = 'info',
}: AppDialogProps) => {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: C.bg }}
      >
        <Dialog.Title>
          <AppText variant="h4" color={type === 'error' ? C.error : C.primary}>
            {title}
          </AppText>
        </Dialog.Title>
        <Dialog.Content>
          <AppText variant="body">{content}</AppText>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <AppButton title={cancelLabel} mode="text" onPress={onDismiss} />
          {onConfirm && (
            <AppButton
              title={confirmLabel}
              onPress={() => {
                onConfirm()
                onDismiss()
              }}
            />
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  actions: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
});
