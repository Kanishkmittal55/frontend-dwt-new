// material-ui
import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ColorScheme, PresetColor, ThemeColorValues } from 'types/theme';

// assets
import defaultColor from 'assets/scss/_themes-vars.module.scss';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export default function Palette(mode: ColorScheme, presetColor: PresetColor): Theme {
  let colors: ThemeColorValues;
  switch (presetColor) {
    case 'default':
    default:
      colors = defaultColor as ThemeColorValues;
      break;
  }

  const theme = createTheme({
    palette: {
      mode,
      common: {
        black: colors.darkPaper
      },
      primary: {
        light: mode === 'dark' ? colors.darkPrimaryLight : colors.primaryLight,
        main: mode === 'dark' ? colors.darkPrimaryMain : colors.primaryMain,
        dark: mode === 'dark' ? colors.darkPrimaryDark : colors.primaryDark,
        200: mode === 'dark' ? colors.darkPrimary200 : colors.primary200,
        800: mode === 'dark' ? colors.darkPrimary800 : colors.primary800
      },
      secondary: {
        light: mode === 'dark' ? colors.darkSecondaryLight : colors.secondaryLight,
        main: mode === 'dark' ? colors.darkSecondaryMain : colors.secondaryMain,
        dark: mode === 'dark' ? colors.darkSecondaryDark : colors.secondaryDark,
        200: mode === 'dark' ? colors.darkSecondary200 : colors.secondary200,
        800: mode === 'dark' ? colors.darkSecondary800 : colors.secondary800
      },
      error: {
        light: colors.errorLight,
        main: colors.errorMain,
        dark: colors.errorDark
      },
      orange: {
        light: colors.orangeLight,
        main: colors.orangeMain,
        dark: colors.orangeDark
      },
      warning: {
        light: colors.warningLight,
        main: colors.warningMain,
        dark: colors.warningDark
      },
      success: {
        light: colors.successLight,
        200: colors.success200,
        main: colors.successMain,
        dark: colors.successDark
      },
      grey: {
        50: colors.grey50,
        100: colors.grey100,
        500: mode === 'dark' ? colors.darkTextSecondary : colors.grey500,
        600: mode === 'dark' ? colors.darkTextTitle : colors.grey900,
        700: mode === 'dark' ? colors.darkTextPrimary : colors.grey700,
        900: mode === 'dark' ? colors.darkTextPrimary : colors.grey900
      },
      text: {
        primary: mode === 'dark' ? colors.darkTextPrimary : colors.grey700,
        secondary: mode === 'dark' ? colors.darkTextSecondary : colors.grey500,
        dark: mode === 'dark' ? colors.darkTextPrimary : colors.grey900,
        hint: colors.grey100
      },
      background: {
        paper: mode === 'dark' ? colors.darkLevel2 : colors.paper,
        default: mode === 'dark' ? colors.darkPaper : colors.paper
      }
    }
  });

  return theme;
}