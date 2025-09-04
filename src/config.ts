import type { ThemeConfig } from 'types/config';

export const DASHBOARD_PATH = '/dashboard/default';

const config: Omit<ThemeConfig, 'mode' | 'outlinedFilled' | 'presetColor' | 'miniDrawer'> = {
  fontFamily: `'Roboto', sans-serif`,
  mode: 'light',
  outlinedFilled: true,
  presetColor: 'default',
  miniDrawer: false,
  borderRadius: 8
};

export default config;