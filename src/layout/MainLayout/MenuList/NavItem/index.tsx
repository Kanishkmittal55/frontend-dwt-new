@@ .. @@
 import PropTypes from 'prop-types';
 import { useEffect, useRef, useState } from 'react';
 import { Link, matchPath, useLocation } from 'react-router-dom';
+import type { FC } from 'react';
+import type { MenuItem } from 'types';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // assets
 import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

-export default function NavItem({ item, level, isParents = false, setSelectedID }) {
+interface NavItemProps {
+  item: MenuItem;
+  level: number;
+  isParents?: boolean;
+  setSelectedID?: () => void;
+}
+
+const NavItem: FC<NavItemProps> = ({ item, level, isParents = false, setSelectedID }) => {
   const theme = useTheme();
   const downMD = useMediaQuery(theme.breakpoints.down('md'));
   const ref = useRef(null);
@@ .. @@
       </ListItemButton>
     </>
   );
-}
+};

-NavItem.propTypes = { item: PropTypes.any, level: PropTypes.number, isParents: PropTypes.bool, setSelectedID: PropTypes.func };
+export default NavItem;