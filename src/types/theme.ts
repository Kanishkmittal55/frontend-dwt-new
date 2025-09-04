// Theme System Types

import type { Theme, PaletteColor, SimplePaletteColorOptions } from '@mui/material/styles';

// Extended palette colors
export interface ExtendedPaletteColor extends PaletteColor {
  200?: string;
  800?: string;
}

export interface ExtendedSimplePaletteColorOptions extends SimplePaletteColorOptions {
  200?: string;
  800?: string;
}

// Custom palette additions
export interface CustomPalette {
  orange: ExtendedPaletteColor;
  dark: ExtendedPaletteColor;
}

// Custom shadows interface
export interface CustomShadows {
  z1: string;
  z4: string;
  z8: string;
  z12: string;
  z16: string;
  z20: string;
  z24: string;
  primary: string;
  secondary: string;
  info: string;
  success: string;
  warning: string;
  error: string;
  orange?: string;
}

// Typography variants
export interface CustomTypographyVariants {
  customInput: React.CSSProperties;
  mainContent: React.CSSProperties;
  menuCaption: React.CSSProperties;
  subMenuCaption: React.CSSProperties;
  commonAvatar: React.CSSProperties;
  smallAvatar: React.CSSProperties;
  mediumAvatar: React.CSSProperties;
  largeAvatar: React.CSSProperties;
}

// Theme configuration
export interface ThemeOptions {
  palette?: any;
  typography?: any;
  customShadows?: CustomShadows;
  components?: any;
  breakpoints?: any;
  direction?: 'ltr' | 'rtl';
  mixins?: any;
}

// Component style override props
export interface ComponentStyleOverrideProps {
  theme: Theme;
  borderRadius: number;
  outlinedFilled: boolean;
}

// Color scheme types
export type ColorScheme = 'light' | 'dark';
export type PresetColor = 'default' | 'theme1' | 'theme2' | 'theme3' | 'theme4' | 'theme5' | 'theme6';

// Theme color values
export interface ThemeColorValues {
  // Paper & background
  paper: string;
  darkPaper: string;
  darkBackground: string;
  darkLevel1: string;
  darkLevel2: string;

  // Primary colors
  primaryLight: string;
  primary200: string;
  primaryMain: string;
  primaryDark: string;
  primary800: string;
  darkPrimaryLight: string;
  darkPrimary200: string;
  darkPrimaryMain: string;
  darkPrimaryDark: string;
  darkPrimary800: string;

  // Secondary colors
  secondaryLight: string;
  secondary200: string;
  secondaryMain: string;
  secondaryDark: string;
  secondary800: string;
  darkSecondaryLight: string;
  darkSecondary200: string;
  darkSecondaryMain: string;
  darkSecondaryDark: string;
  darkSecondary800: string;

  // Success colors
  successLight: string;
  success200: string;
  successMain: string;
  successDark: string;

  // Error colors
  errorLight: string;
  errorMain: string;
  errorDark: string;

  // Warning colors
  warningLight: string;
  warningMain: string;
  warningDark: string;

  // Orange colors
  orangeLight: string;
  orangeMain: string;
  orangeDark: string;

  // Grey colors
  grey50: string;
  grey100: string;
  grey200: string;
  grey300: string;
  grey500: string;
  grey600: string;
  grey700: string;
  grey900: string;

  // Dark text colors
  darkTextTitle: string;
  darkTextPrimary: string;
  darkTextSecondary: string;
}