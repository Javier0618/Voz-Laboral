/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
