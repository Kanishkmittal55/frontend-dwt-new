import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import type { RouteErrorResponse } from 'types/utilities';

// material-ui
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

// ==============================|| ELEMENT ERROR - COMMON ||============================== //

export default function ErrorBoundary() {
  const error = useRouteError() as RouteErrorResponse | Error;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <Alert severity="error">
          <Typography variant="h6">404 - Page Not Found</Typography>
          <Typography>The page you're looking for doesn't exist.</Typography>
        </Alert>
      );
    }

    if (error.status === 401) {
      return (
        <Alert severity="error">
          <Typography variant="h6">401 - Unauthorized</Typography>
          <Typography>You don't have permission to access this resource.</Typography>
        </Alert>
      );
    }

    if (error.status === 503) {
      return (
        <Alert severity="error">
          <Typography variant="h6">503 - Service Unavailable</Typography>
          <Typography>The service is temporarily unavailable.</Typography>
        </Alert>
      );
    }

    if (error.status === 418) {
      return (
        <Alert severity="error">
          <Typography variant="h6">418 - I'm a teapot</Typography>
          <Typography>The server refuses to brew coffee because it is, permanently, a teapot.</Typography>
        </Alert>
      );
    }
  }

  return (
    <Alert severity="error">
      <Typography variant="h6">Something went wrong</Typography>
      <Typography>{error instanceof Error ? error.message : 'An unexpected error occurred'}</Typography>
    </Alert>
  );
}