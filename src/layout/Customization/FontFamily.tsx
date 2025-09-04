@@ .. @@
 // material-ui
 import FormControlLabel from '@mui/material/FormControlLabel';
 import Grid from '@mui/material/Grid';
+import type { FC } from 'react';
 import Radio from '@mui/material/Radio';
 import RadioGroup from '@mui/material/RadioGroup';
 import Stack from '@mui/material/Stack';
@@ .. @@
 // ==============================|| CUSTOMIZATION - FONT FAMILY ||============================== //

-export default function FontFamilyPage() {
+const FontFamilyPage: FC = () => {
   const { fontFamily, onChangeFontFamily } = useConfig();

-  const handleFontChange = (event) => {
+  const handleFontChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     onChangeFontFamily(event.target.value);
   };

@@ .. @@
       </RadioGroup>
     </Stack>
   );
-}
+};
+
+export default FontFamilyPage;