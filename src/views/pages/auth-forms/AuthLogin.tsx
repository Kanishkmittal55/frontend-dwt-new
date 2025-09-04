@@ .. @@
 import { useState } from 'react';
 import { Link } from 'react-router-dom';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ===============================|| JWT - LOGIN ||=============================== //

-export default function AuthLogin() {
+const AuthLogin: FC = () => {
   const theme = useTheme();

@@ .. @@
   const [showPassword, setShowPassword] = useState(false);
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
+export default AuthLogin;