@@ .. @@
+interface ChartOptions {
+  chart: {
+    type: string;
+    height: number;
+    stacked: boolean;
+    toolbar: { show: boolean };
+    zoom: { enabled: boolean };
+  };
+  plotOptions: {
+    bar: {
+      horizontal: boolean;
+      columnWidth: string;
+    };
+  };
+  dataLabels: { enabled: boolean };
+  xaxis: {
+    type: string;
+    categories: string[];
+  };
+  fill: { type: string };
+  legend: {
+    show: boolean;
+    fontFamily: string;
+    position: string;
+    offsetX: number;
+    labels: {
+      useSeriesColors: boolean;
+    };
+    markers: {
+      size: number;
+      shape: string;
+    };
+    itemMargin: {
+      horizontal: number;
+      vertical: number;
+    };
+  };
+  grid: { show: boolean };
+}
+
 // ==============================|| DASHBOARD - TOTAL GROWTH BAR CHART ||============================== //

-const chartOptions = {
+const chartOptions: ChartOptions = {
   chart: {
     type: 'bar',