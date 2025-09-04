// Material-UI theme augmentation
import '@mui/material/styles';
import type { CustomShadows, ExtendedPaletteColor, CustomTypographyVariants } from './theme';

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: CustomShadows;
  }

  interface ThemeOptions {
    customShadows?: Partial<CustomShadows>;
  }

  interface Palette {
    orange: ExtendedPaletteColor;
    dark: ExtendedPaletteColor;
  }

  interface PaletteOptions {
    orange?: Partial<ExtendedPaletteColor>;
    dark?: Partial<ExtendedPaletteColor>;
  }

  interface PaletteColor {
    200?: string;
    800?: string;
  }

  interface SimplePaletteColorOptions {
    200?: string;
    800?: string;
  }

  interface TypographyVariants extends CustomTypographyVariants {}

  interface TypographyVariantsOptions extends Partial<CustomTypographyVariants> {}
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