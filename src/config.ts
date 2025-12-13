import type { ThemeConfig } from 'types/config';

export const DASHBOARD_PATH = '/dashboard/default';

// Environment detection
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

// Feature flags
export const SHOW_DEV_TOOLS = isDev; // Auto-populate buttons, debug panels, etc.

const config: Omit<ThemeConfig, 'mode' | 'outlinedFilled' | 'presetColor' | 'miniDrawer'> = {
  fontFamily: `'Roboto', sans-serif`,
  mode: 'light',
  outlinedFilled: true,
  presetColor: 'default',
  miniDrawer: false,
  borderRadius: 8
};

export default config;