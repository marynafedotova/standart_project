const SEPARATOR = " | ";

export function parseMultiValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  }

  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function joinMultiValue(value: string | string[] | null | undefined) {
  return parseMultiValue(value).join(SEPARATOR);
}

export function hasMultiValue(source: string | string[] | null | undefined, value: string) {
  return parseMultiValue(source).includes(value.trim());
}

export function replaceMultiValue(
  source: string | string[] | null | undefined,
  currentName: string,
  nextName: string
) {
  return joinMultiValue(
    parseMultiValue(source).map((item) => (item === currentName ? nextName : item))
  );
}
