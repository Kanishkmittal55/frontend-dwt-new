import { useMemo } from 'react';

// material-ui
import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import useConfig from 'hooks/useConfig';
import Palette from './palette';
import Typography from './typography';
import componentStyleOverrides from './compStyleOverride';
import customShadows from './shadows';
import type { ThemeOptions } from 'types/theme';

interface ThemeCustomizationProps {
  children: React.ReactNode;
}

export default function ThemeCustomization({ children }: ThemeCustomizationProps) {
  const { borderRadius, fontFamily, mode, outlinedFilled, presetColor } = useConfig();

  const theme: Theme = useMemo(() => Palette(mode, presetColor), [mode, presetColor]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const themeTypography = useMemo(() => Typography(theme, borderRadius, fontFamily), [theme, borderRadius, fontFamily]);
  const themeCustomShadows = useMemo(() => customShadows(mode, theme), [mode, theme]);

  const themeOptions: ThemeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1536
        }
      },
      direction: 'ltr',
      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8
        }
      },
      palette: theme.palette,
      customShadows: themeCustomShadows,
      typography: themeTypography
    }),
    [theme, themeTypography, themeCustomShadows]
  );

  const themes: Theme = createTheme(themeOptions);
  themes.components = componentStyleOverrides(themes, borderRadius, outlinedFilled);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themes}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}