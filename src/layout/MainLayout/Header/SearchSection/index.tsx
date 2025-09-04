@@ .. @@
 import PropTypes from 'prop-types';
 import { useState } from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 // assets
 import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons-react';

-function HeaderAvatarComponent({ children, ref, ...others }) {
+interface HeaderAvatarComponentProps {
+  children: React.ReactNode;
+  [key: string]: any;
+}
+
+const HeaderAvatarComponent: FC<HeaderAvatarComponentProps> = ({ children, ...others }) => {
   const theme = useTheme();

@@ .. @@
     >
       {children}
     </Avatar>
   );
-}
+};

 const HeaderAvatar = HeaderAvatarComponent;

 // ==============================|| SEARCH INPUT - MOBILE||============================== //

-function MobileSearch({ value, setValue, popupState }) {
+interface MobileSearchProps {
+  value: string;
+  setValue: (value: string) => void;
+  popupState: any;
+}
+
+const MobileSearch: FC<MobileSearchProps> = ({ value, setValue, popupState }) => {
   const theme = useTheme();

@@ .. @@
       sx={{ width: '100%', ml: 0.5, px: 2, bgcolor: 'background.paper' }}
     />
   );
-}
+};

 // ==============================|| SEARCH INPUT ||============================== //

-export default function SearchSection() {
+const SearchSection: FC = () => {
   const [value, setValue] = useState('');

@@ .. @@
       </Box>
     </>
   );
-}
+};

-HeaderAvatarComponent.propTypes = { children: PropTypes.node, others: PropTypes.any };
-
-MobileSearch.propTypes = { value: PropTypes.string, setValue: PropTypes.func, popupState: PropTypes.any };
+export default SearchSection;