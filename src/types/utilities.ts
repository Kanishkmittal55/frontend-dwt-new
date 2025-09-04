// Utility and Hook Types

export interface ScriptRef {
  current: boolean;
}

export interface ImagePathConfig {
  TESTAMENTS: string;
  USERS: string;
  ECOMMERCE: string;
  PROFILE: string;
  BLOG: string;
}

export interface PasswordStrengthResult {
  label: string;
  color: string;
}

export interface PasswordValidation {
  hasNumber: boolean;
  hasMixed: boolean;
  hasSpecial: boolean;
  hasMinLength: boolean;
  hasGoodLength: boolean;
}

// API and Data Types
export interface ApiEndpoints {
  key: string;
  master: string;
  dashboard: string;
}

export interface SWRConfig {
  revalidateIfStale: boolean;
  revalidateOnFocus: boolean;
  revalidateOnReconnect: boolean;
}

// Form and Input Types
export interface FormControlProps {
  captionLabel?: string;
  formState?: 'error' | 'success' | 'warning' | 'default';
  iconPrimary?: React.ComponentType<any>;
  iconSecondary?: React.ComponentType<any>;
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

// Navigation and Routing Types
export interface NavigationScrollProps {
  children?: React.ReactNode;
}

export interface RouteErrorResponse {
  status: number;
  statusText: string;
  data: any;
}

// Storage and State Types
export type LocalStorageValue<T> = T | null;
export type LocalStorageSetter<T> = (value: T | ((prev: T) => T)) => void;

// Event Handler Types
export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// Generic Component Props
export interface WithChildren {
  children: React.ReactNode;
}

export interface WithClassName {
  className?: string;
}

export interface WithSx {
  sx?: any;
}

export interface BaseProps extends WithChildren, WithClassName, WithSx {
  id?: string;
}