@@ .. @@
+import type { FC } from 'react';
+
 // material-ui
 import Grid from '@mui/material/Grid';
 import Link from '@mui/material/Link';
@@ .. @@
 // ==============================|| TYPOGRAPHY ||============================== //

-export default function Typography() {
+const Typography: FC = () => {
   return (
     <MainCard title="Basic Typography" secondary={<SecondaryAction link="https://next.material-ui.com/system/typography/" />}>
@@ .. @@
       </Grid>
     </MainCard>
   );
-}
+};
+
+export default Typography;