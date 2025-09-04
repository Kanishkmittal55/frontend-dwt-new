@@ .. @@
 import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
+import type { RouteErrorResponse } from 'types/utilities';
 
 // material-ui
 import Alert from '@mui/material/Alert';
@@ -7,7 +8,7 @@ import Alert from '@mui/material/Alert';
 // ==============================|| ELEMENT ERROR - COMMON ||============================== //
 
 export default function ErrorBoundary() {
 }
-  const error = useRouteError();
+  const error = useRouteError() as RouteErrorResponse | Error;
 
   if (isRouteErrorResponse(error)) {
     if (error.status === 404) {
     }
   }