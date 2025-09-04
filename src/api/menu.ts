@@ .. @@
 import useSWR, { mutate } from 'swr';
 import { useMemo } from 'react';
+import type { MenuMaster, MenuContextType } from 'types/config';
 
-const initialState = {
+const initialState: MenuMaster = {
   openedItem: 'dashboard',
   openedComponent: 'buttons',
   openedHorizontalItem: null,
@@ -15,7 +16,7 @@ export const endpoints = {
   dashboard: '/dashboard' // server URL
 };
 
-export function useGetMenuMaster() {
+export function useGetMenuMaster(): MenuContextType {
   const { data, isLoading } = useSWR(endpoints.key + endpoints.master, () => initialState, {
     revalidateIfStale: false,
     revalidateOnFocus: false,
@@ -24,7 +25,7 @@ export function useGetMenuMaster() {
 
   const memoizedValue = useMemo(
     () => ({
-      menuMaster: data,
+      menuMaster: data || initialState,
       menuMasterLoading: isLoading
     }),
     [data, isLoading]
@@ -33,7 +34,7 @@ export function useGetMenuMaster() {
   return memoizedValue;
 }
 
-export function handlerDrawerOpen(isDashboardDrawerOpened) {
+export function handlerDrawerOpen(isDashboardDrawerOpened: boolean): void {
   // to update local state based on key
 
   mutate(
@@ -45,7 +46,7 @@ export function handlerDrawerOpen(isDashboardDrawerOpened) {
   );
 }
 
-export function handlerActiveItem(openedItem) {
+export function handlerActiveItem(openedItem: string): void {
   // to update local state based on key
 
   mutate(