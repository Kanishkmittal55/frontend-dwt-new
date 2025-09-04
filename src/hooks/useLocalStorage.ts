@@ .. @@
 import { useState, useEffect } from 'react';
 
 // ==============================|| HOOKS - LOCAL STORAGE ||============================== //
 
-export default function useLocalStorage(key, defaultValue) {
-  const [value, setValue] = useState(() => {
+export default function useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T | ((currentValue: T) => T)) => void] {
+  const [value, setValue] = useState<T>(() => {
     const storedValue = localStorage.getItem(key);
     return storedValue === null ? defaultValue : JSON.parse(storedValue);
   });
 
   useEffect(() => {
-    const listener = (e) => {
+    const listener = (e: StorageEvent) => {
       if (e.storageArea === localStorage && e.key === key) {
-        setValue(e.newValue ? JSON.parse(e.newValue) : e.newValue);
+        setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue);
       }
     };
     window.addEventListener('storage', listener);
@@ -30,8 +30,8 @@ export default function useLocalStorage(key, defaultValue) {
     };
   }, [key, defaultValue]);
 
-  const setValueInLocalStorage = (newValue) => {
-    setValue((currentValue) => {
+  const setValueInLocalStorage = (newValue: T | ((currentValue: T) => T)) => {
+    setValue((currentValue: T) => {
       const result = typeof newValue === 'function' ? newValue(currentValue) : newValue;
       localStorage.setItem(key, JSON.stringify(result));
       return result;