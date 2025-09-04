@@ .. @@
+import type { MenuItem } from 'types';
+
 import dashboard from './dashboard';
 import pages from './pages';
 import utilities from './utilities';
@@ .. @@
 // ==============================|| MENU ITEMS ||============================== //

-const menuItems = {
+interface MenuItems {
+  items: MenuItem[];
+}
+
+const menuItems: MenuItems = {
   items: [dashboard, pages, utilities, other]
 };