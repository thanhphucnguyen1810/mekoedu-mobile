import React, { createContext, useContext, useMemo, useState } from 'react';
import { C, Colors } from './Colors'; // Nhớ đổi đường dẫn nếu file khác tên
// import { Shadows } from './shadow'; // Tạm comment nếu bạn chưa có file này
import { Radius, Spacing } from './Spacing';
import { Typography } from './Typography';

// Theme configuration type (SV2 Requirements)
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  borderRadius?: number;
  fontScale?: number;
}

// Complete theme type
export interface Theme {
  colors: typeof Colors;
  c: typeof C; // Flat alias
  spacing: typeof Spacing;
  radius: typeof Radius; // Alias for borders
  typography: typeof Typography;
  // shadows: typeof Shadows;
  config: ThemeConfig;
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
}

const defaultConfig: ThemeConfig = {
  mode: 'light',
  fontScale: 1,
};

const defaultTheme: Theme = {
  colors: Colors,
  c: C,
  spacing: Spacing,
  radius: Radius,
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
    // Dynamic color generation based on config (White-label support)
    const dynamicColors = {
      ...Colors,
      primary: {
        ...Colors.primary,
        500: config.primaryColor || Colors.primary[500],
      },
    } as typeof Colors;

    // Update flat alias if primary color changes
    const dynamicC = {
      ...C,
      primary: config.primaryColor || C.primary,
    } as typeof C;

    return {
      ...defaultTheme,
      colors: dynamicColors,
      c: dynamicC,
      config,
      setThemeConfig: updateConfig,
    };
  }, [config]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};
