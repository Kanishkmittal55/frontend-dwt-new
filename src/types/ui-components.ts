// UI Component Type Definitions

import type { ReactNode, ComponentType, CSSProperties } from 'react';
import type { Theme, SxProps } from '@mui/material/styles';
import type { AvatarProps, CardProps as MuiCardProps, ChipProps } from '@mui/material';

// Base component props
export interface BaseComponentProps {
  className?: string;
  sx?: SxProps<Theme>;
  children?: ReactNode;
}

// Card component types
export interface MainCardProps extends BaseComponentProps {
  border?: boolean;
  boxShadow?: boolean;
  children?: ReactNode;
  content?: boolean;
  contentClass?: string;
  contentSX?: SxProps<Theme>;
  headerSX?: SxProps<Theme>;
  darkTitle?: boolean;
  secondary?: ReactNode;
  shadow?: string;
  title?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  [key: string]: any;
}

export interface SubCardProps extends BaseComponentProps {
  children?: ReactNode;
  content?: boolean;
  contentClass?: string;
  darkTitle?: boolean;
  secondary?: ReactNode;
  contentSX?: SxProps<Theme>;
  footerSX?: SxProps<Theme>;
  title?: ReactNode;
  actions?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  [key: string]: any;
}

export interface CardSecondaryActionProps {
  title?: string;
  link?: string;
  icon?: ReactNode;
}

// Income card types
export interface TotalIncomeDarkCardProps {
  isLoading: boolean;
}

export interface TotalIncomeLightCardProps {
  isLoading: boolean;
  total: number;
  icon: ReactNode;
  label: string;
}

// Extended component types
export interface ExtendedAvatarProps extends Omit<AvatarProps, 'color'> {
  className?: string;
  color?: string;
  outline?: boolean;
  size?: 'badge' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  sx?: SxProps<Theme>;
}

export interface AppBarProps {
  window?: () => Window;
  [key: string]: any;
}

// Accordion types
export interface AccordionData {
  id: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  defaultExpand?: boolean;
  expanded?: boolean;
}

export interface AccordionProps {
  data: AccordionData[];
  defaultExpandedId?: string | boolean | null;
  expandIcon?: ReactNode | false;
  square?: boolean;
  toggle?: boolean;
}

// Image List types
export interface ImageListItemData {
  img: string;
  title: string;
  featured?: boolean;
}

export interface ImageListProps {
  itemData: ImageListItemData[];
}

// Breadcrumbs types
export interface BreadcrumbLink {
  title: string;
  to?: string;
  icon?: ComponentType<any>;
}

export interface BreadcrumbsProps {
  card?: boolean;
  custom?: boolean;
  divider?: boolean;
  heading?: string;
  icon?: boolean;
  icons?: boolean;
  links?: BreadcrumbLink[];
  maxItems?: number;
  rightAlign?: boolean;
  separator?: ComponentType<any>;
  title?: boolean;
  titleBottom?: boolean;
  sx?: SxProps<Theme>;
  [key: string]: any;
}

// Transitions types
export interface TransitionsProps {
  children: ReactNode;
  position?: 'top-left' | 'top-right' | 'top' | 'bottom-left' | 'bottom-right' | 'bottom';
  sx?: SxProps<Theme>;
  type?: 'grow' | 'collapse' | 'fade' | 'slide' | 'zoom';
  direction?: 'up' | 'right' | 'left' | 'down';
  ref?: React.Ref<HTMLDivElement>;
  [key: string]: any;
}

// Animate Button types
export interface AnimateButtonProps {
  children: ReactNode;
  type?: 'slide' | 'scale' | 'rotate';
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
  scale?: number | { hover: number; tap: number };
  ref?: React.Ref<HTMLDivElement>;
}

// Form component types
export interface InputLabelProps extends BaseComponentProps {
  horizontal?: boolean;
  [key: string]: any;
}

export interface FormControlProps {
  captionLabel?: string;
  formState?: 'error' | 'success' | 'warning' | 'default';
  iconPrimary?: ComponentType<any>;
  iconSecondary?: ComponentType<any>;
  placeholder?: string;
  textPrimary?: string;
  textSecondary?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormControlSelectProps extends FormControlProps {
  currencies?: SelectOption[];
  selected?: string;
}

// Skeleton component types
export interface SkeletonProps {
  isLoading?: boolean;
}

// Loading states
export interface LoadingComponentProps {
  isLoading: boolean;
}

// Chart and data types for dashboard components
export interface ChartDataPoint {
  name?: string;
  data: number[];
}

export interface ChartConfiguration {
  type: string;
  height: number | string;
  options: any;
  series?: ChartDataPoint[];
}

// Dashboard card specific types
export interface DashboardCardProps extends LoadingComponentProps {
  title?: string;
  value?: string | number;
  growth?: number;
  color?: string;
  icon?: ReactNode;
}