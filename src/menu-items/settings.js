// assets
import { IconSettings } from '@tabler/icons-react';

// constant
const icons = { 
  IconSettings
};

// ==============================|| SETTINGS MENU ITEMS ||============================== //

const settings = {
  id: 'settings-group',
  title: '', // Empty title to avoid showing group name
  type: 'group',
  children: [
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.IconSettings,
      breadcrumbs: false
    }
  ]
};

export default settings;