@@ .. @@
 import { useEffect } from 'react';
 import { Outlet } from 'react-router-dom';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ==============================|| MAIN LAYOUT ||============================== //

-export default function MainLayout() {
+const MainLayout: FC = () => {
   const theme = useTheme();
   const downMD = useMediaQuery(theme.breakpoints.down('md'));

@@ .. @@
       <Customization />
     </Box>
   );
-}
+};
+
+export default MainLayout;