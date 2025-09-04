// Material-UI theme augmentation
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: {
      z1: string;
      z8: string;
      z12: string;
      z16: string;
      z20: string;
      z24: string;
      primary: string;
      secondary: string;
      orange: string;
      success: string;
      warning: string;
      error: string;
    };
  }

  interface ThemeOptions {
    customShadows?: {
      z1?: string;
      z8?: string;
      z12?: string;
      z16?: string;
      z20?: string;
      z24?: string;
      primary?: string;
      secondary?: string;
      orange?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
  }

  interface Palette {
    orange: Palette['primary'];
    dark: Palette['primary'];
  }

  interface PaletteOptions {
    orange?: PaletteOptions['primary'];
    dark?: PaletteOptions['primary'];
  }

  interface PaletteColor {
    200?: string;
    800?: string;
  }

  interface SimplePaletteColorOptions {
    200?: string;
    800?: string;
  }

  interface TypographyVariants {
    customInput: React.CSSProperties;
    mainContent: React.CSSProperties;
    menuCaption: React.CSSProperties;
    subMenuCaption: React.CSSProperties;
    commonAvatar: React.CSSProperties;
    smallAvatar: React.CSSProperties;
    mediumAvatar: React.CSSProperties;
    largeAvatar: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    customInput?: React.CSSProperties;
    mainContent?: React.CSSProperties;
    menuCaption?: React.CSSProperties;
    subMenuCaption?: React.CSSProperties;
    commonAvatar?: React.CSSProperties;
    smallAvatar?: React.CSSProperties;
    mediumAvatar?: React.CSSProperties;
    largeAvatar?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    customInput: true;
    mainContent: true;
    menuCaption: true;
    subMenuCaption: true;
    commonAvatar: true;
    smallAvatar: true;
    mediumAvatar: true;
    largeAvatar: true;
  }
}