import { RouterProvider } from 'react-router-dom';
import { StrictMode } from 'react';

// routing
import router from 'routes/index';

// project imports
import NavigationScroll from 'layout/NavigationScroll';

import ThemeCustomization from 'themes';

// auth provider

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <StrictMode>
      <ThemeCustomization>
        <NavigationScroll>
          <RouterProvider router={router} />
        </NavigationScroll>
      </ThemeCustomization>
    </StrictMode>
  );
}