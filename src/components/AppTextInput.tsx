import { C, Spacing, Typography } from '@/src/theme';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';

interface AppTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;            // Nếu là true thì tự động kích hoạt nút con mắt ẩn/hiện pass
  error?: boolean;                      // Trạng thái lỗi
  leftIcon?: string;                    // Icon bên trái (VD: "email", "lock")
}

export const AppTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error = false,
  leftIcon,
  ...props
}: AppTextInputProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        secureTextEntry={secureTextEntry && !passwordVisible}
        mode="outlined"
        style={styles.input}
        outlineColor={C.border}
        activeOutlineColor={C.primary}
        placeholderTextColor={C.textSub}
        theme={{
          colors: {
            primary: C.primary, // Màu của Label chạy lên trên
            error: C.error,     // Màu viền khi báo lỗi
          }
        }}
        left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} color={C.textSub} /> : null}
        right={
          secureTextEntry ? (
            <PaperTextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              color={C.textSub}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          ) : null
        }
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs, // Khoảng cách giữa các ô nhập liệu
    width: '100%',
  },
  input: {
    backgroundColor: C.bg,
    ...Typography.variants.body,
  },
});
