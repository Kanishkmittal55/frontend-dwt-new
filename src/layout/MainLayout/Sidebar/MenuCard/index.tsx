@@ .. @@
 import PropTypes from 'prop-types';
 import { memo } from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ==============================|| PROGRESS BAR WITH LABEL ||============================== //

-function LinearProgressWithLabel({ value, ...others }) {
+interface LinearProgressWithLabelProps {
+  value: number;
+  [key: string]: any;
+}
+
+const LinearProgressWithLabel: FC<LinearProgressWithLabelProps> = ({ value, ...others }) => {
   return (
     <Grid container direction="column" spacing={1} sx={{ mt: 1.5 }}>
       <Grid>
@@ .. @@
       </Grid>
     </Grid>
   );
-}
+};

 // ==============================|| SIDEBAR - MENU CARD ||============================== //

-function MenuCard() {
+const MenuCard: FC = () => {
   const theme = useTheme();

@@ .. @@
       </Box>
     </Card>
   );
-}
+};

-export default memo(MenuCard);
-
-LinearProgressWithLabel.propTypes = { value: PropTypes.number, others: PropTypes.any };
+export default memo(MenuCard);