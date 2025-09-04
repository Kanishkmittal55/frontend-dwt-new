@@ .. @@
+import type { MenuItem } from 'types';
+
 // assets
 import { IconBrandChrome, IconHelp } from '@tabler/icons-react';

@@ .. @@
 // ==============================|| SAMPLE PAGE & DOCUMENTATION MENU ITEMS ||============================== //

-const other = {
+const other: MenuItem = {
   id: 'sample-docs-roadmap',
   type: 'group',