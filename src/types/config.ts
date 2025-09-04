// Configuration and Context Types
import type { ColorScheme, PresetColor } from './theme';

export interface ThemeConfig {
  fontFamily: string;
  borderRadius: number;
  mode: ColorScheme;
  outlinedFilled: boolean;
  presetColor: PresetColor;
  miniDrawer: boolean;
}

export interface ConfigContextType extends ThemeConfig {
  onChangeFontFamily: (fontFamily: string) => void;
  onChangeBorderRadius: (event: Event, newValue: number) => void;
  onReset: () => void;
}

export interface MenuMaster {
  isDashboardDrawerOpened: boolean;
  openedItem: string;
  openedComponent: string;
  openedHorizontalItem: string | null;
  isComponentDrawerOpened: boolean;
}

export interface MenuContextType {
  menuMaster: MenuMaster;
  menuMasterLoading: boolean;
}

// Chart and Dashboard Types
export interface ChartOptions {
  chart?: any;
  colors?: string[];
  dataLabels?: any;
  fill?: any;
  grid?: any;
  legend?: any;
  plotOptions?: any;
  stroke?: any;
  tooltip?: any;
  xaxis?: any;
  yaxis?: any;
}

export interface ChartSeries {
  name?: string;
  data: number[];
}

export interface ChartData {
  type: string;
  height: number | string;
  options: ChartOptions;
  series?: ChartSeries[];
}

// Component Props Types
export interface LoadingProps {
  isLoading: boolean;
}

export interface CardProps {
  title?: string;
  secondary?: React.ReactNode;
  content?: boolean;
  border?: boolean;
  boxShadow?: boolean;
  shadow?: string;
  sx?: any;
  children?: React.ReactNode;
}