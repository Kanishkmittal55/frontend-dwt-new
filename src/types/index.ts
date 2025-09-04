// Global type definitions for the Berry Dashboard application

// Theme related types
export interface ThemeConfig {
  fontFamily: string;
  borderRadius: number;
  mode: 'light' | 'dark';
  outlinedFilled: boolean;
  presetColor: string;
  miniDrawer: boolean;
}

// Menu item types
export interface MenuItem {
  id: string;
  title: string;
  type: 'item' | 'group' | 'collapse';
  url?: string;
  link?: string;
  icon?: React.ComponentType<any>;
  breadcrumbs?: boolean;
  disabled?: boolean;
  external?: boolean;
  target?: boolean;
  caption?: string;
  children?: MenuItem[];
  chip?: {
    color: string;
    variant: string;
    size: string;
    label: string;
    avatar?: string;
  };
}

// API response types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Common component props
export interface BaseComponentProps {
  className?: string;
  sx?: any;
  children?: React.ReactNode;
}

// Chart data types
export interface ChartData {
  series: any[];
  options: any;
  type?: string;
  height?: number | string;
  width?: number | string;
}

// Form field types
export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

// Navigation types
export interface BreadcrumbItem {
  title: string;
  to?: string;
  icon?: React.ComponentType<any>;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// User types (for future authentication)
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

// Export commonly used React types for convenience
export type { 
  ReactNode, 
  ComponentType, 
  FC, 
  PropsWithChildren 
} from 'react';