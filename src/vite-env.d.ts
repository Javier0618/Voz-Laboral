/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_UMAMI_URL?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_DOMAINS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
