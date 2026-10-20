/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Backend origin, only for a deployment where the frontend and API live on different domains
   * (the optional live demo, ADR 0005). Leave unset to call the API on the same origin.
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
