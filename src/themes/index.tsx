@@ .. @@
 import PropTypes from 'prop-types';
 import { useMemo } from 'react';
 
 // material-ui
 import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
 import CssBaseline from '@mui/material/CssBaseline';
 
 // project imports
 import useConfig from 'hooks/useConfig';
 import Palette from './palette';
 import Typography from './typography';
-
 import componentStyleOverrides from './compStyleOverride';
 import customShadows from './shadows';
 
-export default function ThemeCustomization({ children }) {
+interface ThemeCustomizationProps {
+  children: React.ReactNode;
+}
+
+export default function ThemeCustomization({ children }: ThemeCustomizationProps) {
   const { borderRadius, fontFamily, mode, outlinedFilled, presetColor } = useConfig();
 
   const theme = useMemo(() => Palette(mode, presetColor), [mode, presetColor]);
@@ -49,5 +53,3 @@ export default function ThemeCustomization({ children }) {
     </StyledEngineProvider>
   );
 }
-
-ThemeCustomization.propTypes = { children: PropTypes.node };