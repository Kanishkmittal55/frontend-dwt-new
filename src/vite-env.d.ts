/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_NAME: string;
  readonly VITE_APP_VERSION: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}