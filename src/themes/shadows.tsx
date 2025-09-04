@@ .. @@
 // material-ui
 import { alpha } from '@mui/material/styles';
+import type { Theme } from '@mui/material/styles';
 
-function createCustomShadow(theme, color) {
+function createCustomShadow(theme: Theme, color: string) {
   const transparent = alpha(color, 0.24);
   return {
     z1: `0 1px 2px 0 ${transparent}`,
@@ -25,6 +26,6 @@ function createCustomShadow(theme, color) {
   };
 }
 
-export default function customShadows(mode, theme) {
+export default function customShadows(mode: 'light' | 'dark', theme: Theme) {
   return createCustomShadow(theme, theme.palette.grey[900]);
 }