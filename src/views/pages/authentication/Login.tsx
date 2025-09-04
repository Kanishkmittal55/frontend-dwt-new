@@ .. @@
 import { Link } from 'react-router-dom';
+import type { FC } from 'react';

 import useMediaQuery from '@mui/material/useMediaQuery';
 import Divider from '@mui/material/Divider';
@@ .. @@
 // ================================|| AUTH3 - LOGIN ||================================ //

-export default function Login() {
+const Login: FC = () => {
   const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

@@ .. @@
       </Grid>
     </AuthWrapper1>
   );
-}
+};
+
+export default Login;