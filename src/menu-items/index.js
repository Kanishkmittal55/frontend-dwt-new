import dashboard from './dashboard';
import { founderCore, action, preferences } from './founder';

// ==============================|| MENU ITEMS ||============================== //

// Order: Dashboard → Persona/CoFounder/Memory/Mission → Learn/Train/Radar/Intel/Playbook/Shipped → Preferences
const menuItems = {
  items: [dashboard, founderCore, action, preferences]
};

export default menuItems;
