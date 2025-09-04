@@ .. @@
-import PropTypes from 'prop-types';
 import React from 'react';
+import type { FC } from 'react';

 // material-ui
 import { useTheme } from '@mui/material/styles';
@@ .. @@
 import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
 import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

-export default function TotalOrderLineChartCard({ isLoading }) {
+interface TotalOrderLineChartCardProps {
+  isLoading: boolean;
+}
+
+const TotalOrderLineChartCard: FC<TotalOrderLineChartCardProps> = ({ isLoading }) => {
   const theme = useTheme();

   const [timeValue, setTimeValue] = React.useState(false);
-  const handleChangeTime = (event, newValue) => {
+  const handleChangeTime = (event: React.MouseEvent<HTMLElement>, newValue: boolean) => {
     setTimeValue(newValue);
   };

@@ .. @@
       )}
     </>
   );
-}
+};

-TotalOrderLineChartCard.propTypes = { isLoading: PropTypes.bool };
+export default TotalOrderLineChartCard;