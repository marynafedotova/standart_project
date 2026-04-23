export const locales = ["uk", "ru", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "uk";

export function isValidLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}
