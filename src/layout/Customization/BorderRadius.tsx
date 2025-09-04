@@ .. @@
 // material-ui
 import Grid from '@mui/material/Grid';
 import Slider from '@mui/material/Slider';
+import type { FC } from 'react';
 import Stack from '@mui/material/Stack';
 import Typography from '@mui/material/Typography';

@@ .. @@
   return `${value}px`;
 }

-export default function BorderRadius() {
+const BorderRadius: FC = () => {
   const { borderRadius, onChangeBorderRadius } = useConfig();

@@ .. @@
       </Grid>
     </Stack>
   );
-}
+};
+
+export default BorderRadius;