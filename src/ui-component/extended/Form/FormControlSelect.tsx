@@ .. @@
-import PropTypes from 'prop-types';
 import { useState } from 'react';
+import type { FormControlSelectProps } from 'types/utilities';
 
 // material-ui
 import Divider from '@mui/material/Divider';
@@ -8,7 +9,15 @@ import InputAdornment from '@mui/material/InputAdornment';
 import MenuItem from '@mui/material/MenuItem';
 import TextField from '@mui/material/TextField';
 
-export default function FormControlSelect({
+export default function FormControlSelect({
   captionLabel,
   currencies,
   formState,
@@ -17,7 +26,7 @@ export default function FormControlSelect({
   selected,
   textPrimary,
   textSecondary
-}) {
+}: FormControlSelectProps) {
   const IconPrimary = iconPrimary;
   const primaryIcon = iconPrimary ? <IconPrimary fontSize="small" sx={{ color: 'grey.700' }} /> : null;
 
@@ -26,8 +35,8 @@ export default function FormControlSelect({
 
   const errorState = formState === 'error';
   const val = selected || '';
 
-  const [currency, setCurrency] = useState(val);
-  const handleChange = (event) => {
+  const [currency, setCurrency] = useState<string>(val);
+  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     event?.target.value && setCurrency(event?.target.value);
   };
 
@@ -75,15 +84,4 @@ export default function FormControlSelect({
     </FormControl>
   );
 }
-
-FormControlSelect.propTypes = {
-  captionLabel: PropTypes.string,
-  currencies: PropTypes.object,
-  formState: PropTypes.string,
-  iconPrimary: PropTypes.any,
-  iconSecondary: PropTypes.any,
-  selected: PropTypes.string,
-  textPrimary: PropTypes.string,
-  textSecondary: PropTypes.string
-};