@@ .. @@
-export default function Typography(theme, borderRadius, fontFamily) {
+import type { Theme } from '@mui/material/styles';
+
+export default function Typography(theme: Theme, borderRadius: number, fontFamily: string) {
   return {
     fontFamily,
     h6: {