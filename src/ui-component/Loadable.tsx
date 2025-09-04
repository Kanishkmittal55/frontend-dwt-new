@@ .. @@
 import { Suspense } from 'react';
+import type { ComponentType } from 'react';
 
 // project imports
 import Loader from './Loader';
 
-export default function Loadable(Component) {
-  const WrappedComponent = (props) => (
+export default function Loadable<T extends Record<string, any>>(
+  Component: ComponentType<T>
+): ComponentType<T> {
+  const WrappedComponent = (props: T) => (
     <Suspense fallback={<Loader />}>
       <Component {...props} />
     </Suspense>