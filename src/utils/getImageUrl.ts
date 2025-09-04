@@ .. @@
+import type { ImagePathConfig } from 'types/utilities';
+
-export let ImagePath;
+export const ImagePath: ImagePathConfig = {
+  TESTAMENTS: 'testaments',
+  USERS: 'users',
+  ECOMMERCE: 'e-commerce',
+  PROFILE: 'profile',
+  BLOG: 'blog'
+};
 
-(function (ImagePath) {
-  ImagePath['TESTAMENTS'] = 'testaments';
-  ImagePath['USERS'] = 'users';
-  ImagePath['ECOMMERCE'] = 'e-commerce';
-  ImagePath['PROFILE'] = 'profile';
-  ImagePath['BLOG'] = 'blog';
-})(ImagePath || (ImagePath = {}));
-
 // ==============================|| NEW URL - GET IMAGE URL ||============================== //
 
-export function getImageUrl(name, path) {
+export function getImageUrl(name: string, path: keyof ImagePathConfig): string {
   return new URL(`/src/assets/images/${path}/${name}`, import.meta.url).href;
 }