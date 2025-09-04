@@ .. @@
-import PropTypes from 'prop-types';
+import type { FC } from 'react';
+
 // material-ui
 import { useTheme } from '@mui/material/styles';
 import Card from '@mui/material/Card';
@@ .. @@
 // ===============================|| SHADOW BOX ||=============================== //

-function ShadowBox({ shadow }) {
+interface ShadowBoxProps {
+  shadow: string;
+}
+
+const ShadowBox: FC<ShadowBoxProps> = ({ shadow }) => {
   return (
     <Card sx={{ mb: 3, boxShadow: shadow }}>
@@ .. @@
       </Box>
     </Card>
   );
-}
+};

 // ===============================|| SHADOW BOX ||=============================== //

-function CustomShadowBox({ shadow, label, color }) {
+interface CustomShadowBoxProps {
+  shadow: string;
+  label?: string;
+  color: string;
+}
+
+const CustomShadowBox: FC<CustomShadowBoxProps> = ({ shadow, label, color }) => {
   return (
     <Card sx={{ mb: 3, boxShadow: shadow }}>
@@ .. @@
       </Box>
     </Card>
   );
-}
+};

 // ============================|| UTILITIES SHADOW ||============================ //

-export default function UtilitiesShadow() {
+const UtilitiesShadow: FC = () => {
   const theme = useTheme();

@@ .. @@
       </Grid>
     </MainCard>
   );
-}
+};

-ShadowBox.propTypes = { shadow: PropTypes.string };
-
-CustomShadowBox.propTypes = { shadow: PropTypes.string, label: PropTypes.string, color: PropTypes.string };
+export default UtilitiesShadow;