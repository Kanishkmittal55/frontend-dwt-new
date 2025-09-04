@@ .. @@
 import { useEffect, useRef, useState } from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ==============================|| PROFILE MENU ||============================== //

-export default function ProfileSection() {
+const ProfileSection: FC = () => {
   const theme = useTheme();
   const { borderRadius } = useConfig();
   const [sdm, setSdm] = useState(true);
@@ .. @@
       </Popper>
     </>
   );
-}
+};
+
+export default ProfileSection;