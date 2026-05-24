import { C, Typography } from '@/src/theme';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Appbar } from 'react-native-paper';

interface AppHeaderProps {
  title: string;
  showBack?: boolean; // Có hiển thị nút Quay lại không?
  rightIcon?: string; // Tên icon bên phải (VD: "dots-vertical")
  onRightPress?: () => void;
}

export const AppHeader = ({
  title,
  showBack = false,
  rightIcon,
  onRightPress,
}: AppHeaderProps) => {
  const navigation = useNavigation();

  return (
    <Appbar.Header style={{ backgroundColor: C.bg }}>
      {showBack && (
        <Appbar.BackAction onPress={() => navigation.goBack()} color={C.text} />
      )}
      
      <Appbar.Content
        title={title}
        titleStyle={{
          ...Typography.variants.h4,
          color: C.text,
        }}
      />
      
      {rightIcon && (
        <Appbar.Action icon={rightIcon} onPress={onRightPress} color={C.text} />
      )}
    </Appbar.Header>
  );
};
