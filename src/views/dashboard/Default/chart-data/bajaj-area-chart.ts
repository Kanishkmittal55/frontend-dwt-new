@@ .. @@
+interface ChartData {
+  type: string;
+  height: number;
+  options: {
+    chart: {
+      id: string;
+      sparkline: {
+        enabled: boolean;
+      };
+    };
+    dataLabels: {
+      enabled: boolean;
+    };
+    stroke: {
+      curve: string;
+      width: number;
+    };
+    tooltip: {
+      fixed: {
+        enabled: boolean;
+      };
+      x: {
+        show: boolean;
+      };
+      y: {
+        title: {
+          formatter: (seriesName: string) => string;
+        };
+      };
+      marker: {
+        show: boolean;
+      };
+    };
+  };
+  series: Array<{
+    data: number[];
+  }>;
+}
+
 // ==============================|| DASHBOARD - BAJAJ AREA CHART ||============================== //

-const chartData = {
+const chartData: ChartData = {
   type: 'area',
   height: 95,
   options: {
@@ .. @@
       y: {
         title: {
-          formatter: (seriesName) => 'Ticket '
+          formatter: (seriesName: string) => 'Ticket '
         }
       },