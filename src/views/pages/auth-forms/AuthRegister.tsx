@@ .. @@
 import { useState } from 'react';
 import { Link } from 'react-router-dom';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ===========================|| JWT - REGISTER ||=========================== //

-export default function AuthRegister() {
+const AuthRegister: FC = () => {
   const theme = useTheme();

@@ .. @@
   const handleClickShowPassword = () => {
     setShowPassword(!showPassword);
   };

-  const handleMouseDownPassword = (event) => {
+  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
     event.preventDefault();
   };

@@ .. @@
       </Box>
     </>
   );
-}
+};
+
+export default AuthRegister;