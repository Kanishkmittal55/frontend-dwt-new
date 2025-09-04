@@ .. @@
-import PropTypes from 'prop-types';
+import type { FC, ReactNode } from 'react';
+
 // material-ui
 import Box from '@mui/material/Box';

@@ .. @@
 // project imports
 import MainCard from 'ui-component/cards/MainCard';

+interface AuthCardWrapperProps {
+  children: ReactNode;
+  [key: string]: any;
+}
+
 // ==============================|| AUTHENTICATION CARD WRAPPER ||============================== //

-export default function AuthCardWrapper({ children, ...other }) {
+const AuthCardWrapper: FC<AuthCardWrapperProps> = ({ children, ...other }) => {
   return (
     <MainCard
@@ .. @@
       <Box sx={{ p: { xs: 2, sm: 3, xl: 5 } }}>{children}</Box>
     </MainCard>
   );
-}
+};

-AuthCardWrapper.propTypes = { children: PropTypes.any, other: PropTypes.any };
+export default AuthCardWrapper;