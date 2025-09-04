@@ .. @@
 import { useState } from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ==============================|| LIVE CUSTOMIZATION ||============================== //

-export default function Customization() {
+const Customization: FC = () => {
   const theme = useTheme();

@@ .. @@
       </Drawer>
     </>
   );
-}
+};
+
+export default Customization;