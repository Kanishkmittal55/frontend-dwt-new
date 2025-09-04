@@ .. @@
 import PropTypes from 'prop-types';
 import { useEffect, useState } from 'react';
 import { matchPath, useLocation } from 'react-router-dom';
+import type { FC } from 'react';
+import type { MenuItem } from 'types';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // ==============================|| SIDEBAR MENU LIST GROUP ||============================== //

-export default function NavGroup({ item, lastItem, remItems, lastItemId, setSelectedID }) {
+interface NavGroupProps {
+  item: MenuItem;
+  lastItem?: number | null;
+  remItems?: any[];
+  lastItemId?: string;
+  setSelectedID: (id: string) => void;
+}
+
+const NavGroup: FC<NavGroupProps> = ({ item, lastItem, remItems, lastItemId, setSelectedID }) => {
   const theme = useTheme();
   const { pathname } = useLocation();

@@ .. @@
       {drawerOpen && <Divider sx={{ mt: 0.25, mb: 1.25 }} />}
     </>
   );
-}
+};

-NavGroup.propTypes = {
-  item: PropTypes.any,
-  lastItem: PropTypes.number,
-  remItems: PropTypes.array,
-  lastItemId: PropTypes.string,
-  selectedID: PropTypes.oneOfType([PropTypes.any, PropTypes.string]),
-  setSelectedID: PropTypes.oneOfType([PropTypes.any, PropTypes.func])
-};
+export default NavGroup;