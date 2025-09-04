@@ .. @@
 import { memo, useState } from 'react';
+import type { FC } from 'react';
 import Divider from '@mui/material/Divider';
 import List from '@mui/material/List';
 import Typography from '@mui/material/Typography';
@@ .. @@
 // ==============================|| SIDEBAR MENU LIST ||============================== //

-function MenuList() {
+const MenuList: FC = () => {
   const { menuMaster } = useGetMenuMaster();
   const drawerOpen = menuMaster.isDashboardDrawerOpened;

@@ .. @@
   });

   return <Box {...(drawerOpen && { sx: { mt: 1.5 } })}>{navItems}</Box>;
-}
+};

 export default memo(MenuList);