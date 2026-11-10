export interface SeoPage { path: string; title: string; description: string }
export const seoPages: SeoPage[];
export const calculatorSeoPages: SeoPage[];
export const calculatorIndexSeo: SeoPage;
export function seoPageFor(path: string): SeoPage | undefined;
