import dashboard from './dashboard';
import { founderCore, learnTrain, missionExecution, preferences } from './founder';

// ==============================|| MENU ITEMS ||============================== //

// Order: Dashboard → Persona/CoFounder/Memory → Learn/Train → Mission/Radar/Intel/Playbook/Shipped → Preferences
const menuItems = {
  items: [dashboard, founderCore, learnTrain, missionExecution, preferences]
};

export default menuItems;
