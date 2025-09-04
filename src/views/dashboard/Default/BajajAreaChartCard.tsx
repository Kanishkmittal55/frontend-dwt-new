@@ .. @@
 import { useEffect, useState } from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ===========================|| DASHBOARD DEFAULT - BAJAJ AREA CHART CARD ||=========================== //

-export default function BajajAreaChartCard() {
+const BajajAreaChartCard: FC = () => {
   const theme = useTheme();
   const orangeDark = theme.palette.secondary[800];

@@ .. @@
       <Chart {...chartConfig} />
     </Card>
   );
-}
+};
+
+export default BajajAreaChartCard;