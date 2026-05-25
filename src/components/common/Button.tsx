import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'outline'
  isLoading?: boolean
  disabled?: boolean
}

export const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false 
}: ButtonProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'outline' ? styles.outlineButton : styles.primaryButton,
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#000' : '#fff'} />
      ) : (
        <Text style={[
          styles.text, 
          variant === 'outline' ? styles.outlineText : styles.primaryText
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: { padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: '#000' },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#000' },
  disabledButton: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#fff' },
  outlineText: { color: '#000' }
})
