@@ .. @@
+interface LineChartData {
+  type: string;
+  height: number;
+  options: {
+    chart: {
+      sparkline: {
+        enabled: boolean;
+      };
+    };
+    dataLabels: {
+      enabled: boolean;
+    };
+    colors: string[];
+    fill: {
+      type: string;
+      opacity: number;
+    };
+    stroke: {
+      curve: string;
+      width: number;
+    };
+    yaxis: {
+      min: number;
+      max: number;
+      labels: {
+        show: boolean;
+      };
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
+    name: string;
+    data: number[];
+  }>;
+}
+
 // ==============================|| DASHBOARD - TOTAL ORDER MONTH CHART ||============================== //

-const chartData = {
+const chartData: LineChartData = {
   type: 'line',
   height: 90,
   options: {
@@ .. @@
       y: {
         title: {
-          formatter: (seriesName) => 'Total Order'
+          formatter: (seriesName: string) => 'Total Order'
         }
       },