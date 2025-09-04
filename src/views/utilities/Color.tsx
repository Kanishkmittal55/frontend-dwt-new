@@ .. @@
+import type { FC } from 'react';
+
 // material-ui
 import { useTheme } from '@mui/material/styles';
 import Card from '@mui/material/Card';
@@ .. @@
 // ===============================|| COLOR BOX ||=============================== //

-const ColorBox = ({ bgcolor, title, data, dark }) => (
+interface ColorData {
+  label: string;
+  color: string;
+}
+
+interface ColorBoxProps {
+  bgcolor: string;
+  title?: string;
+  data?: ColorData;
+  dark?: boolean;
+}
+
+const ColorBox: FC<ColorBoxProps> = ({ bgcolor, title, data, dark }) => (
   <>
     <Card sx={{ mb: 3 }}>
@@ .. @@
 // ===============================|| UI COLOR ||=============================== //

-export default function UIColor() {
+const UIColor: FC = () => {
   const theme = useTheme();

@@ .. @@
       </Grid>
     </MainCard>
   );
-}
+};
+
+export default UIColor;