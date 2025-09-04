@@ .. @@
-import PropTypes from 'prop-types';
 import { useEffect, useState } from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // chart data
 import barChartOptions from './chart-data/total-growth-bar-chart';

-const status = [
+interface StatusOption {
+  value: string;
+  label: string;
+}
+
+const status: StatusOption[] = [
   { value: 'today', label: 'Today' },
   { value: 'month', label: 'This Month' },
   { value: 'year', label: 'This Year' }
 ];

-const series = [
+interface ChartSeries {
+  name: string;
+  data: number[];
+}
+
+const series: ChartSeries[] = [
   { name: 'Investment', data: [35, 125, 35, 35, 35, 80, 35, 20, 35, 45, 15, 75] },
   { name: 'Loss', data: [35, 15, 15, 35, 65, 40, 80, 25, 15, 85, 25, 75] },
   { name: 'Profit', data: [35, 145, 35, 35, 20, 105, 100, 10, 65, 45, 30, 10] },
   { name: 'Maintenance', data: [0, 0, 75, 0, 0, 115, 0, 0, 0, 0, 150, 0] }
 ];

-export default function TotalGrowthBarChart({ isLoading }) {
+interface TotalGrowthBarChartProps {
+  isLoading: boolean;
+}
+
+const TotalGrowthBarChart: FC<TotalGrowthBarChartProps> = ({ isLoading }) => {
   const theme = useTheme();

   const [value, setValue] = useState('today');
@@ .. @@
                 <Grid>
                   <TextField id="standard-select-currency" select value={value} onChange={(e) => setValue(e.target.value)}>
                     {status.map((option) => (
                       <MenuItem key={option.value} value={option.value}>
@@ .. @@
       )}
     </>
   );
-}
+};

-TotalGrowthBarChart.propTypes = { isLoading: PropTypes.bool };
+export default TotalGrowthBarChart;