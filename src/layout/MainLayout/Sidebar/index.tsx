@@ .. @@
 import { memo, useMemo } from 'react';
+import type { FC } from 'react';

 import useMediaQuery from '@mui/material/useMediaQuery';
 import Chip from '@mui/material/Chip';
@@ .. @@
 // ==============================|| SIDEBAR DRAWER ||============================== //

-function Sidebar() {
+const Sidebar: FC = () => {
   const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

@@ .. @@
       )}
     </Box>
   );
-}
+};

 export default memo(Sidebar);