@@ .. @@
 import PropTypes from 'prop-types';
 import { useEffect, useRef, useState } from 'react';
 import { matchPath, useLocation } from 'react-router-dom';
+import type { FC } from 'react';
+import type { MenuItem } from 'types';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 import { IconChevronDown, IconChevronRight, IconChevronUp } from '@tabler/icons-react';
 import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

-export default function NavCollapse({ menu, level, parentId }) {
+interface NavCollapseProps {
+  menu: MenuItem;
+  level: number;
+  parentId?: string;
+}
+
+const NavCollapse: FC<NavCollapseProps> = ({ menu, level, parentId }) => {
   const theme = useTheme();
   const ref = useRef(null);

@@ .. @@
       )}
     </>
   );
-}
+};

-NavCollapse.propTypes = { menu: PropTypes.any, level: PropTypes.number, parentId: PropTypes.string };
+export default NavCollapse;