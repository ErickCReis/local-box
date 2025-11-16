/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BUILD_MODE?: 'host' | 'client'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

