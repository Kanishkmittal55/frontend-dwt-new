@@ .. @@
 // material-ui
 import { createTheme } from '@mui/material/styles';
 
 // assets
 import defaultColor from 'assets/scss/_themes-vars.module.scss';
 
 // ==============================|| DEFAULT THEME - PALETTE ||============================== //
 
-export default function Palette(mode, presetColor) {
}
+export default function Palette(mode: 'light' | 'dark', presetColor: string) {
   let colors;
   switch (presetColor) {
     case 'default':
   }
}