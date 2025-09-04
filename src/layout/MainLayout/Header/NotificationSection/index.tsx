@@ .. @@
 import { useEffect, useRef, useState } from 'react';
 import { Link } from 'react-router-dom';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // assets
 import { IconBell } from '@tabler/icons-react';

 // notification status options
-const status = [
+const status: Array<{ value: string; label: string }> = [
   {
     value: 'all',
@@ .. @@
 // ==============================|| NOTIFICATION ||============================== //

-export default function NotificationSection() {
+const NotificationSection: FC = () => {
   const theme = useTheme();
   const downMD = useMediaQuery(theme.breakpoints.down('md'));

@@ .. @@
       </Popper>
     </>
   );
-}
+};
+
+export default NotificationSection;