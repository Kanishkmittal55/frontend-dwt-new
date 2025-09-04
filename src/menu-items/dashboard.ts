@@ .. @@
+import type { MenuItem } from 'types';
+
 // assets
 import { IconDashboard } from '@tabler/icons-react';

@@ .. @@
 // ==============================|| DASHBOARD MENU ITEMS ||============================== //

-const dashboard = {
+const dashboard: MenuItem = {
   id: 'dashboard',
   title: 'Dashboard',
   type: 'group',