@@ .. @@
 import value from 'assets/scss/_themes-vars.module.scss';
+import type { PasswordStrengthResult } from 'types/utilities';
 
 // has number
-const hasNumber = (number) => new RegExp(/[0-9]/).test(number);
+const hasNumber = (text: string): boolean => new RegExp(/[0-9]/).test(text);
 
 // has mix of small and capitals
-const hasMixed = (number) => new RegExp(/[a-z]/).test(number) && new RegExp(/[A-Z]/).test(number);
+const hasMixed = (text: string): boolean => new RegExp(/[a-z]/).test(text) && new RegExp(/[A-Z]/).test(text);
 
 // has special chars
-const hasSpecial = (number) => new RegExp(/[!#@$%^&*)(+=._-]/).test(number);
+const hasSpecial = (text: string): boolean => new RegExp(/[!#@$%^&*)(+=._-]/).test(text);
 
 // set color based on password strength
-export const strengthColor = (count) => {
+export const strengthColor = (count: number): PasswordStrengthResult => {
   if (count < 2) return { label: 'Poor', color: value.errorMain };
   if (count < 3) return { label: 'Weak', color: value.warningDark };
   if (count < 4) return { label: 'Normal', color: value.orangeMain };
@@ -20,7 +23,7 @@ export const strengthColor = (count) => {
 };
 
 // password strength indicator
-export const strengthIndicator = (number) => {
+export const strengthIndicator = (password: string): number => {
   let strengths = 0;
-  if (number.length > 5) strengths += 1;
-  if (number.length > 7) strengths += 1;
-  if (hasNumber(number)) strengths += 1;
-  if (hasSpecial(number)) strengths += 1;
-  if (hasMixed(number)) strengths += 1;
+  if (password.length > 5) strengths += 1;
+  if (password.length > 7) strengths += 1;
+  if (hasNumber(password)) strengths += 1;
+  if (hasSpecial(password)) strengths += 1;
+  if (hasMixed(password)) strengths += 1;
   return strengths;
 };