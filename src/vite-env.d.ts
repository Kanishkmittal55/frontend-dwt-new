/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_NAME: string;
  readonly VITE_APP_VERSION: string;
  // Founder OS API
  readonly VITE_FOUNDER_API_URL: string;
  readonly VITE_FOUNDER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}