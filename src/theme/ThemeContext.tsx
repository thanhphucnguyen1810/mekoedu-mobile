import React, { createContext, useContext, useMemo, useState } from 'react';

import { C, Colors } from "./Colors";
import { Radius, Spacing } from "./Spacing";
import { Typography } from "./Typography";

export interface ThemeConfig {
  mode: "light" | "dark" | "auto";
  primaryColor?: string;
  borderRadius?: number;
  fontScale?: number;
}

// Complete theme type
export interface Theme {
  colors: typeof Colors;
  c: typeof C; // Flat alias
  spacing: typeof Spacing;
  radius: Record<keyof typeof Radius, number>;
  typography: typeof Typography;
  borderRadius: typeof borderRadius; // alias cho radius
  borderWidth: typeof borderWidth;
  config: ThemeConfig;
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
}

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const borderWidth = {
  none: 0,
  hairline: 0.5,
  thin: 1,
  normal: 1.5,
  thick: 2,
  heavy: 3,
};

const defaultConfig: ThemeConfig = {
  mode: "light",
  fontScale: 1,
};

const defaultTheme: Theme = {
  colors: Colors,
  c: C,
  spacing: Spacing,
  radius: Radius,
  borderRadius: borderRadius,
  borderWidth: borderWidth,
  typography: Typography,
  // shadows: Shadows,
  config: defaultConfig,
  setThemeConfig: () => {},
};

const ThemeContext = createContext<Theme>(defaultTheme);

// Theme Provider Component
export const ThemeProvider: React.FC<{
  initialConfig?: Partial<ThemeConfig>;
  children: React.ReactNode;
}> = ({ initialConfig, children }) => {
  const [config, setConfig] = useState<ThemeConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const updateConfig = (newConfig: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const theme = useMemo(() => {
    // 1. Tự động lấy chế độ hệ thống nếu config.mode là 'auto'
    const isDark = config.mode === "dark";
    // 2. Cập nhật bảng màu theo L/D
    const dynamicColors = {
      ...Colors,
      primary: {
        ...Colors.primary,
        500: config.primaryColor || Colors.primary[500],
      },
      background: {
        ...Colors.background,
        // Nếu là dark mode thì đảo màu nền, không thì giữ nguyên
        primary: isDark ? Colors.neutral[950] : Colors.background.primary,
        secondary: isDark ? Colors.neutral[900] : Colors.background.secondary,
      },
    } as typeof Colors;

    const dynamicC = {
      ...C,
      primary: config.primaryColor || C.primary,
      bg: isDark ? Colors.neutral[950] : Colors.background.primary,
      
      bgSoft: isDark ? Colors.neutral[900] : Colors.background.secondary, 

      text: isDark ? Colors.neutral[50] : Colors.neutral[900],
      textSub: isDark ? Colors.neutral[400] : Colors.neutral[500],
      border: isDark ? Colors.neutral[800] : Colors.neutral[200],
    } as typeof C;

    // 4. Cập nhật bo góc từ config
    const dynamicRadius: Record<keyof typeof Radius, number> = {
      ...Radius,
      md: config.borderRadius ?? Radius.md,
    };

    return {
      ...defaultTheme,
      colors: dynamicColors,
      c: dynamicC,
      radius: dynamicRadius,
      borderRadius: { ...borderRadius, md: config.borderRadius ?? borderRadius.md }, // giữ đồng bộ
      borderWidth: borderWidth, 
      config,
      setThemeConfig: updateConfig,
    };
  }, [config]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};


// Hook to use theme
export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
};
