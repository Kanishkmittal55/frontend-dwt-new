@@ .. @@
 import { Link as RouterLink } from 'react-router-dom';
+import type { FC } from 'react';

 // material-ui
 import Link from '@mui/material/Link';
@@ .. @@
 // ==============================|| MAIN LOGO ||============================== //

-export default function LogoSection() {
+const LogoSection: FC = () => {
   return (
     <Link component={RouterLink} to={DASHBOARD_PATH} aria-label="theme-logo">
       <Logo />
     </Link>
   );
-}
+};
+
+export default LogoSection;