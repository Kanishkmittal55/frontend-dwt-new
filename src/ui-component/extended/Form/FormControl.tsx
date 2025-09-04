@@ .. @@
-import PropTypes from 'prop-types';
 // material-ui
 import Divider from '@mui/material/Divider';
 import InputAdornment from '@mui/material/InputAdornment';
 import InputLabel from '@mui/material/InputLabel';
 import OutlinedInput from '@mui/material/OutlinedInput';
 import MUIFormControl from '@mui/material/FormControl';
+import type { FormControlProps } from 'types/utilities';
 
-export default function FormControl({ captionLabel, formState, iconPrimary, iconSecondary, placeholder, textPrimary, textSecondary }) {
+export default function FormControl({ 
+  captionLabel, 
+  formState, 
+  iconPrimary, 
+  iconSecondary, 
+  placeholder, 
+  textPrimary, 
+  textSecondary 
+}: FormControlProps) {
   const IconPrimary = iconPrimary;
   const primaryIcon = iconPrimary ? <IconPrimary fontSize="small" sx={{ color: 'grey.700' }} /> : null;
 
@@ -58,14 +65,4 @@ export default function FormControl({ captionLabel, formState, iconPrimary, ico
       />
     </MUIFormControl>
   );
 }
-
-FormControl.propTypes = {
-  captionLabel: PropTypes.string,
-  formState: PropTypes.string,
-  iconPrimary: PropTypes.any,
-  iconSecondary: PropTypes.any,
-  placeholder: PropTypes.string,
-  textPrimary: PropTypes.string,
-  textSecondary: PropTypes.string
-};