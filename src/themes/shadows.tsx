// material-ui
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { CustomShadows, ColorScheme } from 'types/theme';

function createCustomShadow(theme: Theme, color: string): CustomShadows {
  const transparent = alpha(color, 0.24);
  return {
    z1: `0 1px 2px 0 ${transparent}`,
    z4: `0 4px 8px 0 ${transparent}`,
    z8: `0 8px 16px 0 ${transparent}`,
    z12: `0 12px 24px -4px ${transparent}`,
    z16: `0 16px 32px -4px ${transparent}`,
    z20: `0 20px 40px -4px ${transparent}`,
    z24: `0 24px 48px 0 ${transparent}`,
    primary: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.24)}`,
    secondary: `0 8px 16px 0 ${alpha(theme.palette.secondary.main, 0.24)}`,
    info: `0 8px 16px 0 ${alpha(theme.palette.info.main, 0.24)}`,
    success: `0 8px 16px 0 ${alpha(theme.palette.success.main, 0.24)}`,
    warning: `0 8px 16px 0 ${alpha(theme.palette.warning.main, 0.24)}`,
    error: `0 8px 16px 0 ${alpha(theme.palette.error.main, 0.24)}`
  };
}

export default function customShadows(mode: ColorScheme, theme: Theme): CustomShadows {
  return createCustomShadow(theme, theme.palette.grey[900]);
}