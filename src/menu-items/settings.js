// assets
import { IconSettings, IconKey, IconUser } from '@tabler/icons-react';

// constant
const icons = { 
  IconSettings,
  IconKey,
  IconUser
};

// ==============================|| SETTINGS MENU ITEMS ||============================== //

const settings = {
  id: 'settings-group',
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
