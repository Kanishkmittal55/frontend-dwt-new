import type { ThemeConfig } from 'types/config';

export const DASHBOARD_PATH = '/sample-page';

const config: Omit<ThemeConfig, 'mode' | 'outlinedFilled' | 'presetColor' | 'miniDrawer'> = {
  fontFamily: `'Roboto', sans-serif`,
  borderRadius: 8
};

export default config;