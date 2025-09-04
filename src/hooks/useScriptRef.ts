@@ .. @@
 import { useEffect, useRef } from 'react';
+import type { ScriptRef } from 'types/utilities';
 
 // ==============================|| ELEMENT REFERENCE HOOKS ||============================== //
 
-export default function useScriptRef() {
}
-  const scripted = useRef(true);
+export default function useScriptRef(): React.MutableRefObject<boolean> {
}
+  const scripted = useRef<boolean>(true);
 
   useEffect(() => {
     scripted.current = false;
   }
   )