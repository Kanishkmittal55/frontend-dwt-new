@@ .. @@
+import type { FC } from 'react';
+
 // material-ui
 import Typography from '@mui/material/Typography';

@@ .. @@
 // ==============================|| SAMPLE PAGE ||============================== //

-export default function SamplePage() {
+const SamplePage: FC = () => {
   return (
     <MainCard title="Sample Card">
@@ .. @@
       </Typography>
     </MainCard>
   );
-}
+};
+
+export default SamplePage;