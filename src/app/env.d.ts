/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL: contributed sessions go to /sessions, control statistics come from /controls. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
