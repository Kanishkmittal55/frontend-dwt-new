@@ .. @@
-import PropTypes from 'prop-types';
 import React from 'react';
+import type { FC } from 'react';

 // material-ui
 import Avatar from '@mui/material/Avatar';
@@ .. @@
 import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
 import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

-export default function PopularCard({ isLoading }) {
-  const [anchorEl, setAnchorEl] = React.useState(null);
+interface PopularCardProps {
+  isLoading: boolean;
+}

-  const handleClick = (event) => {
+const PopularCard: FC<PopularCardProps> = ({ isLoading }) => {
+  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
+
+  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
     setAnchorEl(event.currentTarget);
   };

@@ .. @@
       )}
     </>
   );
-}
+};

-PopularCard.propTypes = { isLoading: PropTypes.bool };
+export default PopularCard;