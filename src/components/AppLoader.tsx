import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Modal, Portal } from "react-native-paper";

import { C, Spacing } from '@/src/theme';

import { AppText } from './AppText';

interface AppLoaderProps {
  visible: boolean;
  text?: string;
}

export const AppLoader = ({
  visible,
  text = 'Đang tải dữ liệu...',
}: AppLoaderProps) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.content}>
          <ActivityIndicator animating color={C.primary} size="large" />
          {text && (
            <AppText variant="body" style={styles.text}>
              {text}
            </AppText>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: C.bg,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  text: {
    marginTop: Spacing.md,
    color: C.textSub,
  },
});
