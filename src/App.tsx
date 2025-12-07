import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes/index';

// project imports
import NavigationScroll from 'layout/NavigationScroll';

import ThemeCustomization from 'themes';

// Note: AuthProvider is used inside route components since RouterProvider 
// creates its own context. Components that need auth should use useAuth hook.

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <NavigationScroll>
        <RouterProvider router={router} />
      </NavigationScroll>
    </ThemeCustomization>
  );
}