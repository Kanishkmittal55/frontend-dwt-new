@@ .. @@
 // material-ui
 import { useTheme } from '@mui/material/styles';
 import useMediaQuery from '@mui/material/useMediaQuery';
+import type { FC } from 'react';
 import Avatar from '@mui/material/Avatar';
 import Box from '@mui/material/Box';

@@ .. @@
 // ==============================|| MAIN NAVBAR / HEADER ||============================== //

-export default function Header() {
+const Header: FC = () => {
   const theme = useTheme();
   const downMD = useMediaQuery(theme.breakpoints.down('md'));

@@ .. @@
       <ProfileSection />
     </>
   );
-}
+};
+
+export default Header;