// Layout Component Types

import type { ReactNode } from 'react';
import type { Theme } from '@mui/material/styles';

// Main Layout Types
export interface MainLayoutProps {
  children?: ReactNode;
}

export interface HeaderProps {
  drawerOpen?: boolean;
  handleDrawerToggle?: () => void;
}

export interface SidebarProps {
  drawerOpen: boolean;
  drawerToggle: () => void;
  window?: () => Window;
}

// Navigation Types
export interface NavItemProps {
  item: {
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
    children?: any[];
    chip?: {
      color: string;
      variant: string;
      size: string;
      label: string;
      avatar?: string;
    };
  };
  level: number;
  isParents?: boolean;
  setSelectedID?: () => void;
}

export interface NavGroupProps {
  item: NavItemProps['item'];
  lastItem?: number | null;
  remItems?: any[];
  lastItemId?: string;
  setSelectedID: (id: string) => void;
}

export interface NavCollapseProps {
  menu: NavItemProps['item'];
  level: number;
  parentId?: string;
}

// Styled Component Props
export interface MainContentStyledProps {
  theme: Theme;
  open: boolean;
  borderRadius: number;
}

export interface MiniDrawerStyledProps {
  theme: Theme;
  open: boolean;
}

// Search Section Types
export interface SearchSectionProps {
  value?: string;
  onChange?: (value: string) => void;
}

export interface MobileSearchProps {
  value: string;
  setValue: (value: string) => void;
  popupState: any;
}

// Profile Section Types
export interface ProfileSectionProps {
  anchorEl?: HTMLElement | null;
  open?: boolean;
  handleClose?: () => void;
}

// Notification Types
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  avatar?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  time: string;
  read: boolean;
}

export interface NotificationSectionProps {
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

// Customization Types
export interface CustomizationProps {
  open?: boolean;
  onClose?: () => void;
}

export interface FontFamilyProps {
  fontFamily: string;
  onChangeFontFamily: (fontFamily: string) => void;
}

export interface BorderRadiusProps {
  borderRadius: number;
  onChangeBorderRadius: (event: Event, newValue: number) => void;
}

// Menu Card Types
export interface MenuCardProps {
  title?: string;
  progress?: number;
  total?: string;
  used?: string;
}

export interface LinearProgressWithLabelProps {
  value: number;
  [key: string]: any;
}