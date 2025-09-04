@@ .. @@
-import PropTypes from 'prop-types';
 import React from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
 import ArchiveTwoToneIcon from '@mui/icons-material/ArchiveOutlined';

-export default function EarningCard({ isLoading }) {
+interface EarningCardProps {
+  isLoading: boolean;
+}
+
+const EarningCard: FC<EarningCardProps> = ({ isLoading }) => {
   const theme = useTheme();

-  const [anchorEl, setAnchorEl] = React.useState(null);
+  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

-  const handleClick = (event) => {
+  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
     setAnchorEl(event.currentTarget);
   };

@@ .. @@
       )}
     </>
   );
-}
+};

-EarningCard.propTypes = { isLoading: PropTypes.bool };
+export default EarningCard;