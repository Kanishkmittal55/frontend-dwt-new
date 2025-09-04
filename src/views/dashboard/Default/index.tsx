@@ .. @@
-import { useEffect, useState } from 'react';
+import { useEffect, useState } from 'react';
+import type { FC } from 'react';

 // material-ui
 import Grid from '@mui/material/Grid';
@@ .. @@
 // ==============================|| DEFAULT DASHBOARD ||============================== //

-export default function Dashboard() {
+const Dashboard: FC = () => {
   const [isLoading, setLoading] = useState(true);

@@ .. @@
       </Grid>
     </Grid>
   );
-}
+};
+
+export default Dashboard;