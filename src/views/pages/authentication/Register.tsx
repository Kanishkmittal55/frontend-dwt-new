@@ .. @@
 import { Link } from 'react-router-dom';
+import type { FC } from 'react';

 import useMediaQuery from '@mui/material/useMediaQuery';
 import Divider from '@mui/material/Divider';
@@ .. @@
 import Logo from 'ui-component/Logo';
 import AuthFooter from 'ui-component/cards/AuthFooter';

-export default function Register() {
+const Register: FC = () => {
   const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

@@ .. @@
       </Grid>
     </AuthWrapper1>
   );
-}
+};
+
+export default Register;