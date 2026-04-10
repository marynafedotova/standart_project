const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  є: "ie",
  ж: "zh",
  з: "z",
  и: "i",
  і: "i",
  ї: "yi",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ґ: "g"
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function ensureUniqueSlug(base: string, existingSlugs: string[], currentSlug?: string) {
  const normalizedBase = slugify(base) || "product";
  const taken = new Set(existingSlugs.filter((slug) => slug && slug !== currentSlug));

  if (!taken.has(normalizedBase)) {
    return normalizedBase;
  }

  let index = 2;
  let nextSlug = `${normalizedBase}-${index}`;

  while (taken.has(nextSlug)) {
    index += 1;
    nextSlug = `${normalizedBase}-${index}`;
  }

  return nextSlug;
}
