@@ .. @@
-import PropTypes from 'prop-types';
 import { useEffect } from 'react';
+import type { NavigationScrollProps } from 'types/utilities';
 
 // ==============================|| NAVIGATION SCROLL TO TOP ||============================== //
 
-export default function NavigationScroll({ children }) {
+export default function NavigationScroll({ children }: NavigationScrollProps) {
   useEffect(() => {
     window.scrollTo({
@@ -16,6 +16,4 @@ export default function NavigationScroll({ children }) {
 
   return children || null;
 }
-
-NavigationScroll.propTypes = { children: PropTypes.oneOfType([PropTypes.any, PropTypes.node]) };